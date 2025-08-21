/**
 * SQLite database module for analytics and historical tracking
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface AnalyticsDatabase {
  db: Database.Database;
  initialize(): Promise<void>;
  close(): void;
}

export class GuruDatabase implements AnalyticsDatabase {
  public db: Database.Database;
  private dbPath: string;

  constructor(projectPath: string, dbName: string = 'guru-analytics.db') {
    const guruDir = path.join(projectPath, '.codebase-guru');
    fs.ensureDirSync(guruDir);
    
    this.dbPath = path.join(guruDir, dbName);
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    // Create tables for analytics
    this.createTables();
    
    // Create indexes for performance
    this.createIndexes();
    
    // Set up triggers for automatic timestamps
    this.createTriggers();
  }

  /**
   * Create database tables
   */
  private createTables(): void {
    // Analysis runs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        compliance_score REAL NOT NULL,
        total_files INTEGER NOT NULL,
        total_violations INTEGER NOT NULL,
        error_count INTEGER NOT NULL,
        warning_count INTEGER NOT NULL,
        info_count INTEGER NOT NULL,
        analysis_duration_ms INTEGER,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Violations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        file_path TEXT NOT NULL,
        line INTEGER,
        column INTEGER,
        message TEXT NOT NULL,
        suggested_fix TEXT,
        dismissed INTEGER DEFAULT 0,
        dismissal_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE
      )
    `);

    // Pattern history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pattern_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL,
        pattern_value TEXT NOT NULL,
        confidence REAL,
        usage_count INTEGER DEFAULT 0,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE
      )
    `);

    // Component usage table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        component_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        type TEXT,
        props TEXT,
        usage_count INTEGER DEFAULT 1,
        complexity_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE
      )
    `);

    // Drift trends table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS drift_trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        compliance_score REAL NOT NULL,
        total_violations INTEGER NOT NULL,
        files_analyzed INTEGER NOT NULL,
        patterns_detected INTEGER NOT NULL,
        components_count INTEGER NOT NULL,
        trend_direction TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date)
      )
    `);

    // False positives table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS false_positives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        violation_type TEXT NOT NULL,
        file_pattern TEXT,
        directory TEXT,
        reason TEXT,
        confidence_adjustment REAL DEFAULT 0,
        occurrence_count INTEGER DEFAULT 1,
        last_occurrence DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team metrics table (optional)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        contributor TEXT,
        violations_fixed INTEGER DEFAULT 0,
        violations_introduced INTEGER DEFAULT 0,
        compliance_delta REAL DEFAULT 0,
        files_modified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Configuration history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_version TEXT NOT NULL,
        config_data TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Create database indexes for performance
   */
  private createIndexes(): void {
    // Indexes for violations
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_violations_run_id ON violations(run_id);
      CREATE INDEX IF NOT EXISTS idx_violations_type ON violations(type);
      CREATE INDEX IF NOT EXISTS idx_violations_severity ON violations(severity);
      CREATE INDEX IF NOT EXISTS idx_violations_file_path ON violations(file_path);
      CREATE INDEX IF NOT EXISTS idx_violations_dismissed ON violations(dismissed);
    `);

    // Indexes for pattern history
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pattern_history_run_id ON pattern_history(run_id);
      CREATE INDEX IF NOT EXISTS idx_pattern_history_type ON pattern_history(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_pattern_history_last_seen ON pattern_history(last_seen);
    `);

    // Indexes for component usage
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_component_usage_run_id ON component_usage(run_id);
      CREATE INDEX IF NOT EXISTS idx_component_usage_name ON component_usage(component_name);
      CREATE INDEX IF NOT EXISTS idx_component_usage_file ON component_usage(file_path);
    `);

    // Indexes for drift trends
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_drift_trends_date ON drift_trends(date);
      CREATE INDEX IF NOT EXISTS idx_drift_trends_score ON drift_trends(compliance_score);
    `);

    // Indexes for false positives
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_false_positives_type ON false_positives(violation_type);
      CREATE INDEX IF NOT EXISTS idx_false_positives_directory ON false_positives(directory);
    `);
  }

  /**
   * Create database triggers
   */
  private createTriggers(): void {
    // Trigger to update last_seen in pattern_history
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_pattern_last_seen
      AFTER INSERT ON pattern_history
      BEGIN
        UPDATE pattern_history 
        SET last_seen = CURRENT_TIMESTAMP 
        WHERE pattern_type = NEW.pattern_type 
          AND pattern_value = NEW.pattern_value
          AND id != NEW.id;
      END;
    `);

    // Trigger to increment false positive occurrence count
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS increment_false_positive_count
      BEFORE INSERT ON false_positives
      WHEN EXISTS (
        SELECT 1 FROM false_positives 
        WHERE violation_type = NEW.violation_type 
          AND file_pattern = NEW.file_pattern
      )
      BEGIN
        UPDATE false_positives 
        SET occurrence_count = occurrence_count + 1,
            last_occurrence = CURRENT_TIMESTAMP
        WHERE violation_type = NEW.violation_type 
          AND file_pattern = NEW.file_pattern;
        SELECT RAISE(IGNORE);
      END;
    `);
  }

  /**
   * Save analysis run
   */
  saveAnalysisRun(data: {
    complianceScore: number;
    totalFiles: number;
    totalViolations: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    analysisDuration?: number;
    metadata?: any;
  }): number {
    const stmt = this.db.prepare(`
      INSERT INTO analysis_runs (
        compliance_score, total_files, total_violations,
        error_count, warning_count, info_count,
        analysis_duration_ms, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.complianceScore,
      data.totalFiles,
      data.totalViolations,
      data.errorCount,
      data.warningCount,
      data.infoCount,
      data.analysisDuration || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Save violations for an analysis run
   */
  saveViolations(runId: number, violations: any[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO violations (
        run_id, type, severity, file_path, line, column, message, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((violations) => {
      for (const violation of violations) {
        stmt.run(
          runId,
          violation.type,
          violation.severity,
          violation.filePath,
          violation.line || null,
          violation.column || null,
          violation.message,
          violation.suggestedFix || null
        );
      }
    });

    insertMany(violations);
  }

  /**
   * Get compliance score history
   */
  getComplianceHistory(days: number = 30): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(datetime(timestamp, 'unixepoch')) as date,
        AVG(compliance_score) as avg_score,
        MIN(compliance_score) as min_score,
        MAX(compliance_score) as max_score,
        COUNT(*) as run_count
      FROM analysis_runs
      WHERE timestamp > strftime('%s', 'now', '-' || ? || ' days')
      GROUP BY date
      ORDER BY date DESC
    `);

    return stmt.all(days);
  }

  /**
   * Get violation trends
   */
  getViolationTrends(days: number = 30): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        v.type,
        v.severity,
        DATE(datetime(ar.timestamp, 'unixepoch')) as date,
        COUNT(*) as count
      FROM violations v
      JOIN analysis_runs ar ON v.run_id = ar.id
      WHERE ar.timestamp > strftime('%s', 'now', '-' || ? || ' days')
        AND v.dismissed = 0
      GROUP BY v.type, v.severity, date
      ORDER BY date DESC, count DESC
    `);

    return stmt.all(days);
  }

  /**
   * Get component usage statistics
   */
  getComponentUsageStats(): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        component_name,
        COUNT(DISTINCT file_path) as file_count,
        SUM(usage_count) as total_usage,
        AVG(complexity_score) as avg_complexity,
        MAX(created_at) as last_seen
      FROM component_usage
      GROUP BY component_name
      ORDER BY total_usage DESC
    `);

    return stmt.all();
  }

  /**
   * Save drift trend data
   */
  saveDriftTrend(data: {
    complianceScore: number;
    totalViolations: number;
    filesAnalyzed: number;
    patternsDetected: number;
    componentsCount: number;
    trendDirection?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO drift_trends (
        date, compliance_score, total_violations,
        files_analyzed, patterns_detected, components_count,
        trend_direction
      ) VALUES (DATE('now'), ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.complianceScore,
      data.totalViolations,
      data.filesAnalyzed,
      data.patternsDetected,
      data.componentsCount,
      data.trendDirection || null
    );
  }

  /**
   * Get drift hotspots
   */
  getDriftHotspots(limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        file_path,
        COUNT(*) as violation_count,
        GROUP_CONCAT(DISTINCT type) as violation_types,
        MAX(severity) as max_severity
      FROM violations
      WHERE dismissed = 0
      GROUP BY file_path
      ORDER BY violation_count DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  /**
   * Mark violation as dismissed
   */
  dismissViolation(violationId: number, reason: string): void {
    const stmt = this.db.prepare(`
      UPDATE violations 
      SET dismissed = 1, dismissal_reason = ?
      WHERE id = ?
    `);

    stmt.run(reason, violationId);
  }

  /**
   * Save false positive pattern
   */
  saveFalsePositive(data: {
    violationType: string;
    filePattern?: string;
    directory?: string;
    reason?: string;
    confidenceAdjustment?: number;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO false_positives (
        violation_type, file_pattern, directory,
        reason, confidence_adjustment
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.violationType,
      data.filePattern || null,
      data.directory || null,
      data.reason || null,
      data.confidenceAdjustment || 0
    );
  }

  /**
   * Get false positive patterns
   */
  getFalsePositivePatterns(): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM false_positives
      ORDER BY occurrence_count DESC, last_occurrence DESC
    `);

    return stmt.all();
  }

  /**
   * Clean up old data based on retention policy
   */
  cleanupOldData(retentionDays: number = 90): void {
    const stmt = this.db.prepare(`
      DELETE FROM analysis_runs
      WHERE timestamp < strftime('%s', 'now', '-' || ? || ' days')
    `);

    stmt.run(retentionDays);

    // Vacuum to reclaim space
    this.db.exec('VACUUM');
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      complianceHistory: this.getComplianceHistory(90),
      violationTrends: this.getViolationTrends(30),
      componentUsage: this.getComponentUsageStats(),
      driftHotspots: this.getDriftHotspots(20),
      falsePositives: this.getFalsePositivePatterns(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export of compliance history
      const csv = ['Date,Compliance Score,Violations,Run Count'];
      data.complianceHistory.forEach(row => {
        csv.push(`${row.date},${row.avg_score},${row.total_violations || 0},${row.run_count}`);
      });
      return csv.join('\n');
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}