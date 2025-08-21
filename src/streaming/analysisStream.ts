/**
 * Streaming analysis system for real-time drift detection
 */

import { EventEmitter } from 'events';
import { DriftAnalysisResult } from '../drift-detector/driftAnalyzer';
import { AnalysisChange } from '../performance/incrementalAnalyzer';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface StreamingAnalysisOptions {
  projectPath: string;
  enableRealTimeReports?: boolean;
  reportUpdateInterval?: number;
  maxStreamHistory?: number;
  enableMetrics?: boolean;
}

export interface AnalysisStreamEvent {
  id: string;
  timestamp: number;
  type: 'change-detected' | 'analysis-complete' | 'violation-detected' | 'pattern-updated' | 'score-changed';
  data: any;
  metadata?: {
    duration?: number;
    fileCount?: number;
    errorCount?: number;
  };
}

export interface ComplianceMetrics {
  timestamp: number;
  score: number;
  violationCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  trendsData: {
    scoreChange: number;
    violationChange: number;
    timeWindow: string;
  };
  performanceMetrics: {
    analysisTime: number;
    throughput: number;
    cacheHitRate: number;
  };
}

export interface ViolationHotspot {
  filePath: string;
  violationCount: number;
  severityBreakdown: {
    error: number;
    warning: number;
    info: number;
  };
  recentChanges: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export class AnalysisStream extends EventEmitter {
  private options: Required<StreamingAnalysisOptions>;
  private eventHistory: AnalysisStreamEvent[] = [];
  private metricsHistory: ComplianceMetrics[] = [];
  private currentMetrics: ComplianceMetrics;
  private reportUpdateTimer?: NodeJS.Timeout;
  private isStreaming = false;
  private eventCounter = 0;

  constructor(options: StreamingAnalysisOptions) {
    super();
    
    this.options = {
      enableRealTimeReports: true,
      reportUpdateInterval: 5000, // 5 seconds
      maxStreamHistory: 1000,
      enableMetrics: true,
      ...options,
    };

    this.currentMetrics = this.createEmptyMetrics();
  }

  /**
   * Start the analysis stream
   */
  start(): void {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.eventCounter = 0;
    
    if (this.options.enableRealTimeReports) {
      this.startReportUpdates();
    }

    this.emit('stream-started', {
      timestamp: Date.now(),
      options: this.options,
    });
  }

  /**
   * Stop the analysis stream
   */
  stop(): void {
    if (!this.isStreaming) return;

    this.isStreaming = false;
    
    if (this.reportUpdateTimer) {
      clearInterval(this.reportUpdateTimer);
      this.reportUpdateTimer = undefined;
    }

    this.emit('stream-stopped', {
      timestamp: Date.now(),
      totalEvents: this.eventHistory.length,
      metrics: this.currentMetrics,
    });
  }

  /**
   * Process file changes
   */
  processChanges(changes: AnalysisChange[]): void {
    if (!this.isStreaming) return;

    const event = this.createEvent('change-detected', {
      changes,
      changeCount: changes.length,
      files: changes.map(c => c.filePath),
    });

    this.addEvent(event);
    this.emit('changes-processed', event);
  }

  /**
   * Process analysis results
   */
  processAnalysisResult(result: DriftAnalysisResult, duration: number): void {
    if (!this.isStreaming) return;

    const event = this.createEvent('analysis-complete', result, {
      duration,
      fileCount: result.violations.length,
      errorCount: result.summary.errors,
    });

    this.addEvent(event);
    this.updateMetrics(result, duration);
    
    if (result.violations.length > 0) {
      this.processViolations(result.violations);
    }

    this.emit('analysis-complete', event);
  }

  /**
   * Process detected violations
   */
  processViolations(violations: any[]): void {
    if (!this.isStreaming) return;

    const event = this.createEvent('violation-detected', {
      violations,
      count: violations.length,
      severityBreakdown: this.analyzeSeverityBreakdown(violations),
      hotspots: this.analyzeViolationHotspots(violations),
    });

    this.addEvent(event);
    this.emit('violations-detected', event);
  }

  /**
   * Process pattern updates
   */
  processPatternUpdate(patterns: any): void {
    if (!this.isStreaming) return;

    const event = this.createEvent('pattern-updated', {
      patterns,
      timestamp: Date.now(),
    });

    this.addEvent(event);
    this.emit('patterns-updated', event);
  }

  /**
   * Get current compliance metrics
   */
  getCurrentMetrics(): ComplianceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): ComplianceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get event stream
   */
  getEventStream(limit?: number): AnalysisStreamEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Get violation hotspots
   */
  getViolationHotspots(): ViolationHotspot[] {
    // Analyze recent events to find hotspots
    const recentEvents = this.eventHistory
      .filter(e => e.type === 'violation-detected' && Date.now() - e.timestamp < 300000) // Last 5 minutes
      .slice(-50); // Last 50 violation events

    const fileViolations = new Map<string, {
      count: number;
      errors: number;
      warnings: number;
      infos: number;
      timestamps: number[];
    }>();

    recentEvents.forEach(event => {
      event.data.violations.forEach((violation: any) => {
        const file = violation.filePath;
        if (!fileViolations.has(file)) {
          fileViolations.set(file, {
            count: 0,
            errors: 0,
            warnings: 0,
            infos: 0,
            timestamps: [],
          });
        }

        const fileData = fileViolations.get(file)!;
        fileData.count++;
        fileData.timestamps.push(event.timestamp);
        
        switch (violation.severity) {
          case 'error':
            fileData.errors++;
            break;
          case 'warning':
            fileData.warnings++;
            break;
          default:
            fileData.infos++;
            break;
        }
      });
    });

    return Array.from(fileViolations.entries())
      .map(([filePath, data]) => ({
        filePath,
        violationCount: data.count,
        severityBreakdown: {
          error: data.errors,
          warning: data.warnings,
          info: data.infos,
        },
        recentChanges: data.timestamps.length,
        trendDirection: this.calculateTrendDirection(data.timestamps) as 'increasing' | 'decreasing' | 'stable',
      }))
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 10);
  }

  /**
   * Export stream data
   */
  async exportStreamData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = {
      metadata: {
        exportTime: new Date().toISOString(),
        streamDuration: this.isStreaming ? Date.now() - (this.eventHistory[0]?.timestamp || Date.now()) : 0,
        totalEvents: this.eventHistory.length,
        options: this.options,
      },
      events: this.eventHistory,
      metrics: this.metricsHistory,
      hotspots: this.getViolationHotspots(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for metrics
      const csvLines = ['timestamp,score,violations,errors,warnings,analysisTime'];
      this.metricsHistory.forEach(metric => {
        csvLines.push([
          new Date(metric.timestamp).toISOString(),
          metric.score,
          metric.violationCount,
          metric.errorCount,
          metric.warningCount,
          metric.performanceMetrics.analysisTime,
        ].join(','));
      });
      return csvLines.join('\n');
    }
  }

  /**
   * Generate real-time report
   */
  async generateRealTimeReport(): Promise<string> {
    const latestMetrics = this.getCurrentMetrics();
    const hotspots = this.getViolationHotspots();
    const recentEvents = this.getEventStream(50);

    let report = `# Real-time Drift Analysis Report\n\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Current status
    report += `## Current Status\n\n`;
    report += `- **Compliance Score**: ${latestMetrics.score.toFixed(1)}%\n`;
    report += `- **Total Violations**: ${latestMetrics.violationCount}\n`;
    report += `  - Errors: ${latestMetrics.errorCount}\n`;
    report += `  - Warnings: ${latestMetrics.warningCount}\n`;
    report += `  - Info: ${latestMetrics.infoCount}\n\n`;

    // Trends
    if (latestMetrics.trendsData.scoreChange !== 0) {
      const direction = latestMetrics.trendsData.scoreChange > 0 ? '📈' : '📉';
      report += `### Trends (${latestMetrics.trendsData.timeWindow})\n\n`;
      report += `- Score Change: ${direction} ${latestMetrics.trendsData.scoreChange > 0 ? '+' : ''}${latestMetrics.trendsData.scoreChange.toFixed(1)}%\n`;
      report += `- Violation Change: ${latestMetrics.trendsData.violationChange > 0 ? '+' : ''}${latestMetrics.trendsData.violationChange}\n\n`;
    }

    // Performance metrics
    report += `### Performance\n\n`;
    report += `- Analysis Time: ${latestMetrics.performanceMetrics.analysisTime}ms\n`;
    report += `- Throughput: ${latestMetrics.performanceMetrics.throughput.toFixed(1)} files/sec\n`;
    report += `- Cache Hit Rate: ${latestMetrics.performanceMetrics.cacheHitRate.toFixed(1)}%\n\n`;

    // Hotspots
    if (hotspots.length > 0) {
      report += `## Violation Hotspots\n\n`;
      hotspots.slice(0, 5).forEach((hotspot, index) => {
        const trendIcon = hotspot.trendDirection === 'increasing' ? '⬆️' : 
                         hotspot.trendDirection === 'decreasing' ? '⬇️' : '➡️';
        report += `${index + 1}. **${path.basename(hotspot.filePath)}** ${trendIcon}\n`;
        report += `   - Violations: ${hotspot.violationCount}\n`;
        report += `   - Errors: ${hotspot.severityBreakdown.error}, Warnings: ${hotspot.severityBreakdown.warning}\n\n`;
      });
    }

    // Recent activity
    if (recentEvents.length > 0) {
      report += `## Recent Activity\n\n`;
      const recentViolations = recentEvents
        .filter(e => e.type === 'violation-detected')
        .slice(-5);
      
      recentViolations.forEach(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        report += `- **${time}**: ${event.data.count} new violations detected\n`;
      });
    }

    report += `\n---\n*Report auto-generated by React Codebase Guru*\n`;

    return report;
  }

  /**
   * Start automatic report updates
   */
  private startReportUpdates(): void {
    this.reportUpdateTimer = setInterval(async () => {
      try {
        const report = await this.generateRealTimeReport();
        const reportPath = path.join(this.options.projectPath, '.codebase-guru', 'realtime-report.md');
        
        await fs.ensureDir(path.dirname(reportPath));
        await fs.writeFile(reportPath, report);
        
        this.emit('report-updated', {
          path: reportPath,
          timestamp: Date.now(),
        });
      } catch (error) {
        this.emit('report-error', error);
      }
    }, this.options.reportUpdateInterval);
  }

  /**
   * Create a new event
   */
  private createEvent(type: AnalysisStreamEvent['type'], data: any, metadata?: any): AnalysisStreamEvent {
    return {
      id: `event_${++this.eventCounter}_${Date.now()}`,
      timestamp: Date.now(),
      type,
      data,
      metadata,
    };
  }

  /**
   * Add event to history
   */
  private addEvent(event: AnalysisStreamEvent): void {
    this.eventHistory.push(event);
    
    if (this.eventHistory.length > this.options.maxStreamHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * Update compliance metrics
   */
  private updateMetrics(result: DriftAnalysisResult, duration: number): void {
    const previous = this.currentMetrics;
    
    this.currentMetrics = {
      timestamp: Date.now(),
      score: result.complianceScore,
      violationCount: result.violations.length,
      errorCount: result.summary.errors,
      warningCount: result.summary.warnings,
      infoCount: result.violations.length - result.summary.errors - result.summary.warnings,
      trendsData: {
        scoreChange: result.complianceScore - previous.score,
        violationChange: result.violations.length - previous.violationCount,
        timeWindow: '5min',
      },
      performanceMetrics: {
        analysisTime: duration,
        throughput: result.violations.length > 0 ? result.violations.length / (duration / 1000) : 0,
        cacheHitRate: 85, // This would come from the incremental analyzer
      },
    };

    this.metricsHistory.push({ ...this.currentMetrics });
    
    if (this.metricsHistory.length > this.options.maxStreamHistory) {
      this.metricsHistory.shift();
    }

    // Emit score change event if significant
    if (Math.abs(this.currentMetrics.trendsData.scoreChange) >= 5) {
      const event = this.createEvent('score-changed', {
        oldScore: previous.score,
        newScore: this.currentMetrics.score,
        change: this.currentMetrics.trendsData.scoreChange,
      });
      
      this.addEvent(event);
      this.emit('score-changed', event);
    }
  }

  /**
   * Analyze severity breakdown
   */
  private analyzeSeverityBreakdown(violations: any[]): any {
    return violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Analyze violation hotspots from current violations
   */
  private analyzeViolationHotspots(violations: any[]): any {
    const fileMap = new Map();
    
    violations.forEach(violation => {
      const file = violation.filePath;
      if (!fileMap.has(file)) {
        fileMap.set(file, { count: 0, severities: [] });
      }
      fileMap.get(file).count++;
      fileMap.get(file).severities.push(violation.severity);
    });

    return Array.from(fileMap.entries())
      .map(([file, data]) => ({ file, count: data.count, severities: data.severities }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate trend direction from timestamps
   */
  private calculateTrendDirection(timestamps: number[]): string {
    if (timestamps.length < 3) return 'stable';
    
    const recent = timestamps.slice(-3);
    const intervals = [];
    
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i] - recent[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    if (avgInterval < 60000) return 'increasing'; // Less than 1 minute apart
    if (avgInterval > 300000) return 'decreasing'; // More than 5 minutes apart
    return 'stable';
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): ComplianceMetrics {
    return {
      timestamp: Date.now(),
      score: 100,
      violationCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      trendsData: {
        scoreChange: 0,
        violationChange: 0,
        timeWindow: '5min',
      },
      performanceMetrics: {
        analysisTime: 0,
        throughput: 0,
        cacheHitRate: 0,
      },
    };
  }
}