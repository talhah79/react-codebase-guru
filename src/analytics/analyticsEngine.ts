/**
 * Analytics engine for drift analysis and historical tracking
 */

import { GuruDatabase } from './database';
import { ProjectAnalysis } from '../types';

export interface AnalyticsOptions {
  projectPath: string;
  retentionDays?: number;
  enableAutoCleanup?: boolean;
}

export interface TrendAnalysis {
  direction: 'improving' | 'degrading' | 'stable';
  changeRate: number;
  prediction: number;
  confidence: number;
}

export interface HealthScore {
  overall: number;
  compliance: number;
  complexity: number;
  maintainability: number;
  consistency: number;
}

export interface TeamContribution {
  contributor: string;
  violationsFixed: number;
  violationsIntroduced: number;
  complianceDelta: number;
  filesModified: number;
}

export class AnalyticsEngine {
  private db: GuruDatabase;
  private options: Required<AnalyticsOptions>;

  constructor(options: AnalyticsOptions) {
    this.options = {
      retentionDays: 90,
      enableAutoCleanup: true,
      ...options,
    };

    this.db = new GuruDatabase(options.projectPath);
  }

  /**
   * Initialize analytics engine
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
    
    // Auto cleanup old data if enabled
    if (this.options.enableAutoCleanup) {
      this.db.cleanupOldData(this.options.retentionDays);
    }
  }

  /**
   * Record analysis run
   */
  recordAnalysisRun(analysis: ProjectAnalysis, duration?: number): number {
    const violations = analysis.violations;
    
    const runId = this.db.saveAnalysisRun({
      complianceScore: analysis.compliance.score,
      totalFiles: analysis.compliance.totalFiles,
      totalViolations: violations.length,
      errorCount: violations.filter(v => v.severity === 'error').length,
      warningCount: violations.filter(v => v.severity === 'warning').length,
      infoCount: violations.filter(v => v.severity === 'info').length,
      analysisDuration: duration,
      metadata: {
        framework: analysis.framework,
        timestamp: analysis.timestamp,
      },
    });

    // Save violations
    if (violations.length > 0) {
      this.db.saveViolations(runId, violations);
    }

    // Save component usage
    this.saveComponentUsage(runId, analysis);

    // Save pattern history
    this.savePatternHistory(runId, analysis);

    // Update drift trends
    this.updateDriftTrends(analysis);

    return runId;
  }

  /**
   * Save component usage data
   */
  private saveComponentUsage(runId: number, analysis: ProjectAnalysis): void {
    const stmt = this.db.db.prepare(`
      INSERT INTO component_usage (
        run_id, component_name, file_path, type, props, usage_count, complexity_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.db.transaction((components) => {
      for (const component of components) {
        const complexity = this.calculateComponentComplexity(component);
        stmt.run(
          runId,
          component.name,
          component.filePath,
          component.type,
          JSON.stringify(component.props || []),
          1, // Usage count would be calculated from actual usage
          complexity
        );
      }
    });

    insertMany(analysis.components);
  }

  /**
   * Save pattern history
   */
  private savePatternHistory(runId: number, analysis: ProjectAnalysis): void {
    const stmt = this.db.db.prepare(`
      INSERT INTO pattern_history (
        run_id, pattern_type, pattern_value, confidence, usage_count
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const patterns = analysis.patterns;
    if (!patterns || !Array.isArray(patterns)) return;

    const insertMany = this.db.db.transaction(() => {
      // For now, just track pattern count
      // Detailed pattern tracking would need access to the full DesignPatterns object
      patterns.forEach((pattern: any) => {
        if (pattern.type && pattern.value) {
          stmt.run(runId, pattern.type, pattern.value, pattern.confidence || 0.8, 1);
        }
      });
    });

    insertMany();
  }

  /**
   * Update drift trends
   */
  private updateDriftTrends(analysis: ProjectAnalysis): void {
    const trendDirection = this.calculateTrendDirection(analysis.compliance.score);
    
    this.db.saveDriftTrend({
      complianceScore: analysis.compliance.score,
      totalViolations: analysis.violations.length,
      filesAnalyzed: analysis.compliance.totalFiles,
      patternsDetected: Object.keys(analysis.patterns || {}).length,
      componentsCount: analysis.components.length,
      trendDirection,
    });
  }

  /**
   * Calculate component complexity
   */
  private calculateComponentComplexity(component: any): number {
    let complexity = 1;
    
    // Factor in props count
    if (component.props && component.props.length > 0) {
      complexity += component.props.length * 0.2;
    }
    
    // Factor in dependencies
    if (component.dependencies && component.dependencies.length > 0) {
      complexity += component.dependencies.length * 0.1;
    }
    
    // Factor in component type
    if (component.type === 'class') {
      complexity += 0.5;
    }
    
    return Math.min(complexity, 10);
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(currentScore: number): string {
    const history = this.db.getComplianceHistory(7);
    if (history.length === 0) return 'stable';
    
    const avgScore = history.reduce((sum, h) => sum + h.avg_score, 0) / history.length;
    const diff = currentScore - avgScore;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'degrading';
    return 'stable';
  }

  /**
   * Analyze drift trends over time
   */
  analyzeDriftTrends(days: number = 30): TrendAnalysis {
    const history = this.db.getComplianceHistory(days);
    
    if (history.length < 2) {
      return {
        direction: 'stable',
        changeRate: 0,
        prediction: history[0]?.avg_score || 100,
        confidence: 0.5,
      };
    }

    // Calculate linear regression for trend
    const n = history.length;
    const sumX = history.reduce((sum, _, i) => sum + i, 0);
    const sumY = history.reduce((sum, h) => sum + h.avg_score, 0);
    const sumXY = history.reduce((sum, h, i) => sum + i * h.avg_score, 0);
    const sumX2 = history.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next value
    const prediction = slope * n + intercept;
    
    // Calculate R-squared for confidence
    const avgY = sumY / n;
    const totalSS = history.reduce((sum, h) => sum + Math.pow(h.avg_score - avgY, 2), 0);
    const residualSS = history.reduce((sum, h, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(h.avg_score - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSS / totalSS);
    
    return {
      direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'degrading' : 'stable',
      changeRate: slope,
      prediction: Math.max(0, Math.min(100, prediction)),
      confidence: Math.max(0, Math.min(1, rSquared)),
    };
  }

  /**
   * Get project health score
   */
  calculateHealthScore(): HealthScore {
    const complianceHistory = this.db.getComplianceHistory(30);
    const violationTrends = this.db.getViolationTrends(30);
    const componentStats = this.db.getComponentUsageStats();
    
    // Calculate compliance score (average of recent)
    const compliance = complianceHistory.length > 0
      ? complianceHistory.reduce((sum, h) => sum + h.avg_score, 0) / complianceHistory.length
      : 100;
    
    // Calculate complexity score (based on component complexity)
    const avgComplexity = componentStats.length > 0
      ? componentStats.reduce((sum, c) => sum + (c.avg_complexity || 0), 0) / componentStats.length
      : 1;
    const complexity = Math.max(0, 100 - (avgComplexity * 10));
    
    // Calculate maintainability (based on violation density)
    const recentViolations = violationTrends.filter(v => v.severity === 'error').length;
    const maintainability = Math.max(0, 100 - (recentViolations * 2));
    
    // Calculate consistency (based on pattern stability)
    const patternStmt = this.db.db.prepare(`
      SELECT COUNT(DISTINCT pattern_value) as variety
      FROM pattern_history
      WHERE pattern_type = ?
    `);
    
    const spacingResult = patternStmt.get('spacing_value') as any;
    const colorResult = patternStmt.get('color_primary') as any;
    const spacingVariety = spacingResult?.variety || 0;
    const colorVariety = colorResult?.variety || 0;
    const consistency = Math.max(0, 100 - ((spacingVariety + colorVariety) * 2));
    
    // Calculate overall health
    const overall = (compliance * 0.4 + complexity * 0.2 + maintainability * 0.2 + consistency * 0.2);
    
    return {
      overall: Math.round(overall),
      compliance: Math.round(compliance),
      complexity: Math.round(complexity),
      maintainability: Math.round(maintainability),
      consistency: Math.round(consistency),
    };
  }

  /**
   * Get drift hotspots
   */
  getDriftHotspots(limit: number = 10): any[] {
    return this.db.getDriftHotspots(limit);
  }

  /**
   * Get component usage analytics
   */
  getComponentUsageAnalytics(): any {
    const stats = this.db.getComponentUsageStats();
    
    // Calculate usage patterns
    const totalUsage = stats.reduce((sum, s) => sum + s.total_usage, 0);
    const avgUsage = totalUsage / stats.length;
    
    // Find underused and overused components
    const underused = stats.filter(s => s.total_usage < avgUsage * 0.5);
    const overused = stats.filter(s => s.total_usage > avgUsage * 2);
    
    // Calculate diversity score
    const uniqueComponents = stats.length;
    const diversityScore = Math.min(100, uniqueComponents * 2);
    
    return {
      totalComponents: stats.length,
      totalUsage,
      averageUsage: avgUsage,
      mostUsed: stats.slice(0, 5),
      leastUsed: stats.slice(-5).reverse(),
      underused,
      overused,
      diversityScore,
      complexityDistribution: this.calculateComplexityDistribution(stats),
    };
  }

  /**
   * Calculate complexity distribution
   */
  private calculateComplexityDistribution(stats: any[]): any {
    const distribution = {
      simple: 0,     // complexity < 2
      moderate: 0,   // complexity 2-5
      complex: 0,    // complexity > 5
    };
    
    stats.forEach(s => {
      if (s.avg_complexity < 2) distribution.simple++;
      else if (s.avg_complexity <= 5) distribution.moderate++;
      else distribution.complex++;
    });
    
    return distribution;
  }

  /**
   * Get violation analytics
   */
  getViolationAnalytics(days: number = 30): any {
    const trends = this.db.getViolationTrends(days);
    const hotspots = this.db.getDriftHotspots(20);
    
    // Group violations by type
    const byType = trends.reduce((acc, t) => {
      if (!acc[t.type]) acc[t.type] = 0;
      acc[t.type] += t.count;
      return acc;
    }, {});
    
    // Group violations by severity
    const bySeverity = trends.reduce((acc, t) => {
      if (!acc[t.severity]) acc[t.severity] = 0;
      acc[t.severity] += t.count;
      return acc;
    }, {});
    
    // Calculate resolution rate (dismissed violations)
    const totalStmt = this.db.db.prepare('SELECT COUNT(*) as total FROM violations');
    const dismissedStmt = this.db.db.prepare('SELECT COUNT(*) as dismissed FROM violations WHERE dismissed = 1');
    
    const totalResult = totalStmt.get() as any;
    const dismissedResult = dismissedStmt.get() as any;
    const total = totalResult?.total || 0;
    const dismissed = dismissedResult?.dismissed || 0;
    const resolutionRate = total > 0 ? (dismissed / total) * 100 : 0;
    
    return {
      totalViolations: total,
      dismissedViolations: dismissed,
      resolutionRate,
      byType,
      bySeverity,
      hotspots,
      trends: this.aggregateTrends(trends),
    };
  }

  /**
   * Aggregate violation trends
   */
  private aggregateTrends(trends: any[]): any {
    const daily: Record<string, any> = {};
    
    trends.forEach(t => {
      if (!daily[t.date]) {
        daily[t.date] = { total: 0, errors: 0, warnings: 0, info: 0 };
      }
      
      daily[t.date].total += t.count;
      daily[t.date][t.severity] = (daily[t.date][t.severity] || 0) + t.count;
    });
    
    return Object.entries(daily).map(([date, data]) => ({
      date,
      ...(data as object),
    }));
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
    return this.db.exportAnalytics(format);
  }

  /**
   * Track team contribution (optional)
   */
  trackTeamContribution(data: TeamContribution): void {
    const stmt = this.db.db.prepare(`
      INSERT INTO team_metrics (
        date, contributor, violations_fixed, violations_introduced,
        compliance_delta, files_modified
      ) VALUES (DATE('now'), ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.contributor,
      data.violationsFixed,
      data.violationsIntroduced,
      data.complianceDelta,
      data.filesModified
    );
  }

  /**
   * Get team metrics
   */
  getTeamMetrics(days: number = 30): any[] {
    const stmt = this.db.db.prepare(`
      SELECT 
        contributor,
        SUM(violations_fixed) as total_fixed,
        SUM(violations_introduced) as total_introduced,
        AVG(compliance_delta) as avg_compliance_delta,
        SUM(files_modified) as total_files_modified,
        COUNT(*) as contribution_days
      FROM team_metrics
      WHERE date > DATE('now', '-' || ? || ' days')
      GROUP BY contributor
      ORDER BY total_fixed DESC
    `);
    
    return stmt.all(days);
  }

  /**
   * Dismiss violation
   */
  dismissViolation(violationId: number, reason: string): void {
    this.db.dismissViolation(violationId, reason);
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
    this.db.saveFalsePositive(data);
  }

  /**
   * Get false positive patterns
   */
  getFalsePositivePatterns(): any[] {
    return this.db.getFalsePositivePatterns();
  }

  /**
   * Close analytics engine
   */
  close(): void {
    this.db.close();
  }
}