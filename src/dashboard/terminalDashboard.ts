/**
 * Interactive terminal dashboard for real-time monitoring
 */

import chalk from 'chalk';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import { AnalysisChange } from '../performance/incrementalAnalyzer';

export interface DashboardData {
  timestamp: number;
  complianceScore: number;
  violations: any[];
  changes: AnalysisChange[];
  sessionStats: {
    filesWatched: number;
    changesDetected: number;
    violationsFound: number;
    duration: number;
  };
  trendData: {
    scores: number[];
    timestamps: number[];
    violationCounts: number[];
  };
}

export interface DashboardOptions {
  refreshRate?: number;
  maxHistoryPoints?: number;
  showTrends?: boolean;
  showHotspots?: boolean;
  enableKeyboardShortcuts?: boolean;
}

export class TerminalDashboard extends EventEmitter {
  private options: Required<DashboardOptions>;
  private isActive = false;
  private currentView: 'overview' | 'violations' | 'trends' | 'hotspots' = 'overview';
  private data: DashboardData;
  private history: DashboardData[] = [];
  private selectedViolationIndex = 0;
  private filterText = '';
  private rl?: readline.Interface;

  constructor(options: DashboardOptions = {}) {
    super();
    
    this.options = {
      refreshRate: 1000,
      maxHistoryPoints: 100,
      showTrends: true,
      showHotspots: true,
      enableKeyboardShortcuts: true,
      ...options,
    };

    this.data = this.createEmptyData();
    this.setupKeyboardHandlers();
  }

  /**
   * Start the dashboard
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    console.clear();
    this.hideCursor();
    this.render();

    if (this.options.enableKeyboardShortcuts) {
      this.setupInteractiveMode();
    }

    this.emit('started');
  }

  /**
   * Stop the dashboard
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.showCursor();
    
    if (this.rl) {
      this.rl.close();
    }

    console.clear();
    this.emit('stopped');
  }

  /**
   * Update dashboard with new data
   */
  updateData(data: Partial<DashboardData>): void {
    this.data = {
      ...this.data,
      ...data,
      timestamp: Date.now(),
    };

    // Add to history
    this.history.push({ ...this.data });
    if (this.history.length > this.options.maxHistoryPoints) {
      this.history.shift();
    }

    // Update trend data
    this.updateTrendData();

    if (this.isActive) {
      this.render();
    }
  }

  /**
   * Set current view
   */
  setView(view: typeof this.currentView): void {
    this.currentView = view;
    this.selectedViolationIndex = 0;
    if (this.isActive) {
      this.render();
    }
  }

  /**
   * Set violation filter
   */
  setFilter(filter: string): void {
    this.filterText = filter.toLowerCase();
    this.selectedViolationIndex = 0;
    if (this.isActive) {
      this.render();
    }
  }

  /**
   * Navigate violations
   */
  navigateViolations(direction: 'up' | 'down'): void {
    const filteredViolations = this.getFilteredViolations();
    
    if (direction === 'up') {
      this.selectedViolationIndex = Math.max(0, this.selectedViolationIndex - 1);
    } else {
      this.selectedViolationIndex = Math.min(
        filteredViolations.length - 1,
        this.selectedViolationIndex + 1
      );
    }

    if (this.isActive) {
      this.render();
    }
  }

  /**
   * Main render method
   */
  private render(): void {
    if (!this.isActive) return;

    console.clear();
    this.renderHeader();
    
    switch (this.currentView) {
      case 'overview':
        this.renderOverview();
        break;
      case 'violations':
        this.renderViolations();
        break;
      case 'trends':
        this.renderTrends();
        break;
      case 'hotspots':
        this.renderHotspots();
        break;
    }

    this.renderFooter();
  }

  /**
   * Render header section
   */
  private renderHeader(): void {
    const title = chalk.cyan.bold('React Codebase Guru - Real-time Dashboard');
    const timestamp = new Date(this.data.timestamp).toLocaleTimeString();
    
    console.log('╭' + '─'.repeat(78) + '╮');
    console.log(`│ ${title}${' '.repeat(78 - title.length - 2)}│`);
    console.log(`│ ${chalk.gray(`Last updated: ${timestamp}`)}${' '.repeat(78 - timestamp.length - 17)}│`);
    console.log('├' + '─'.repeat(78) + '┤');
  }

  /**
   * Render overview section
   */
  private renderOverview(): void {
    const score = this.data.complianceScore;
    const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
    const scoreBar = this.createProgressBar(score, 100, 20);

    console.log(`│ Compliance Score: ${scoreColor.bold(score.toFixed(1) + '%')} ${scoreBar}${' '.repeat(20)}│`);
    console.log('│                                                                              │');
    
    // Session stats
    const stats = this.data.sessionStats;
    console.log(`│ Files Watched: ${chalk.white.bold(stats.filesWatched.toString().padEnd(8))} Changes: ${chalk.white.bold(stats.changesDetected.toString().padEnd(8))} Violations: ${chalk.red.bold(stats.violationsFound.toString())}${' '.repeat(15)}│`);
    console.log(`│ Duration: ${chalk.gray(this.formatDuration(stats.duration))}${' '.repeat(50)}│`);
    console.log('│                                                                              │');

    // Recent violations
    if (this.data.violations.length > 0) {
      console.log(`│ ${chalk.red.bold('Recent Violations:')}${' '.repeat(54)}│`);
      const recentViolations = this.data.violations.slice(0, 5);
      
      recentViolations.forEach(violation => {
        const severity = violation.severity === 'error' ? '🔴' : '🟡';
        const message = violation.message.length > 60 ? 
          violation.message.substring(0, 57) + '...' : 
          violation.message;
        console.log(`│ ${severity} ${chalk.gray(message)}${' '.repeat(Math.max(0, 74 - message.length))}│`);
      });

      if (this.data.violations.length > 5) {
        const more = this.data.violations.length - 5;
        console.log(`│ ${chalk.gray(`... and ${more} more violations`)}${' '.repeat(45)}│`);
      }
    } else {
      console.log(`│ ${chalk.green('✅ No violations detected')}${' '.repeat(48)}│`);
    }

    // Trends mini-chart
    if (this.options.showTrends && this.data.trendData.scores.length > 1) {
      console.log('│                                                                              │');
      console.log(`│ ${chalk.blue.bold('Compliance Trend:')}${' '.repeat(55)}│`);
      const trendLine = this.createMiniTrendLine(this.data.trendData.scores, 60);
      console.log(`│ ${trendLine}${' '.repeat(Math.max(0, 76 - trendLine.length))}│`);
    }
  }

  /**
   * Render violations section
   */
  private renderViolations(): void {
    const filteredViolations = this.getFilteredViolations();
    
    if (this.filterText) {
      console.log(`│ Filter: "${this.filterText}" (${filteredViolations.length} results)${' '.repeat(40)}│`);
      console.log('│                                                                              │');
    }

    if (filteredViolations.length === 0) {
      console.log(`│ ${chalk.green('No violations found')}${' '.repeat(55)}│`);
      return;
    }

    // Show violations with selection
    const startIndex = Math.max(0, this.selectedViolationIndex - 5);
    const endIndex = Math.min(filteredViolations.length, startIndex + 10);
    
    for (let i = startIndex; i < endIndex; i++) {
      const violation = filteredViolations[i];
      const isSelected = i === this.selectedViolationIndex;
      const prefix = isSelected ? '►' : ' ';
      const severity = violation.severity === 'error' ? '🔴' : violation.severity === 'warning' ? '🟡' : 'ℹ️';
      
      const bg = isSelected ? chalk.bgBlue : (text: string) => text;
      const typeText = violation.type.replace(/-/g, ' ').toUpperCase();
      
      console.log(`│${prefix} ${severity} ${bg(typeText)}${' '.repeat(Math.max(0, 72 - typeText.length))}│`);
      
      if (isSelected) {
        const message = violation.message.length > 70 ? 
          violation.message.substring(0, 67) + '...' : 
          violation.message;
        console.log(`│   ${chalk.gray(message)}${' '.repeat(Math.max(0, 73 - message.length))}│`);
        
        if (violation.suggestedFix) {
          const fix = violation.suggestedFix.length > 65 ? 
            violation.suggestedFix.substring(0, 62) + '...' : 
            violation.suggestedFix;
          console.log(`│   ${chalk.blue('💡 ' + fix)}${' '.repeat(Math.max(0, 71 - fix.length))}│`);
        }
      }
    }

    // Navigation info
    if (filteredViolations.length > 10) {
      const current = this.selectedViolationIndex + 1;
      const total = filteredViolations.length;
      console.log('│                                                                              │');
      console.log(`│ ${chalk.gray(`Showing ${current}/${total} violations (use ↑↓ to navigate)`)}${' '.repeat(35)}│`);
    }
  }

  /**
   * Render trends section
   */
  private renderTrends(): void {
    if (this.data.trendData.scores.length < 2) {
      console.log(`│ ${chalk.yellow('Not enough data for trends (need at least 2 data points)')}${' '.repeat(20)}│`);
      return;
    }

    // Compliance score trend
    console.log(`│ ${chalk.blue.bold('Compliance Score Trend:')}${' '.repeat(50)}│`);
    const scoreTrend = this.createDetailedTrendChart(this.data.trendData.scores, 'Score', 60, 8);
    scoreTrend.forEach(line => {
      console.log(`│ ${line}${' '.repeat(Math.max(0, 76 - line.length))}│`);
    });

    console.log('│                                                                              │');

    // Violation count trend
    console.log(`│ ${chalk.red.bold('Violation Count Trend:')}${' '.repeat(51)}│`);
    const violationTrend = this.createDetailedTrendChart(this.data.trendData.violationCounts, 'Count', 60, 8);
    violationTrend.forEach(line => {
      console.log(`│ ${line}${' '.repeat(Math.max(0, 76 - line.length))}│`);
    });
  }

  /**
   * Render hotspots section
   */
  private renderHotspots(): void {
    // Group violations by file to find hotspots
    const fileViolations = new Map<string, number>();
    
    this.data.violations.forEach(violation => {
      const file = violation.filePath.split('/').pop() || violation.filePath;
      fileViolations.set(file, (fileViolations.get(file) || 0) + 1);
    });

    const hotspots = Array.from(fileViolations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (hotspots.length === 0) {
      console.log(`│ ${chalk.green('No violation hotspots detected')}${' '.repeat(45)}│`);
      return;
    }

    console.log(`│ ${chalk.red.bold('Top Violation Hotspots:')}${' '.repeat(50)}│`);
    console.log('│                                                                              │');

    const maxViolations = hotspots[0][1];
    
    hotspots.forEach(([file, count], index) => {
      const barLength = Math.max(1, Math.round((count / maxViolations) * 40));
      const bar = '█'.repeat(barLength);
      const fileDisplay = file.length > 30 ? '...' + file.slice(-27) : file;
      const countText = count.toString().padStart(3);
      
      console.log(`│ ${(index + 1).toString().padStart(2)}. ${fileDisplay.padEnd(30)} ${chalk.red(bar)} ${countText}${' '.repeat(Math.max(0, 10 - bar.length))}│`);
    });
  }

  /**
   * Render footer with keyboard shortcuts
   */
  private renderFooter(): void {
    console.log('├' + '─'.repeat(78) + '┤');
    
    if (this.options.enableKeyboardShortcuts) {
      const shortcuts = [
        'Tab: Switch View',
        '↑↓: Navigate',
        '/ : Filter',
        'r: Refresh',
        'q: Quit'
      ].join(' │ ');
      
      console.log(`│ ${chalk.gray(shortcuts)}${' '.repeat(Math.max(0, 76 - shortcuts.length))}│`);
    }
    
    console.log('╰' + '─'.repeat(78) + '╯');
  }

  /**
   * Setup keyboard handlers
   */
  private setupKeyboardHandlers(): void {
    if (!this.options.enableKeyboardShortcuts) return;

    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
  }

  /**
   * Setup interactive mode
   */
  private setupInteractiveMode(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdin.on('keypress', (_, key) => {
      if (!this.isActive) return;

      switch (key.name) {
        case 'tab':
          this.switchView();
          break;
        case 'up':
          if (this.currentView === 'violations') {
            this.navigateViolations('up');
          }
          break;
        case 'down':
          if (this.currentView === 'violations') {
            this.navigateViolations('down');
          }
          break;
        case 'slash':
          this.promptFilter();
          break;
        case 'r':
          this.render();
          break;
        case 'q':
          this.stop();
          break;
        case 'c':
          if (key.ctrl) {
            this.stop();
          }
          break;
      }
    });
  }

  /**
   * Switch to next view
   */
  private switchView(): void {
    const views: (typeof this.currentView)[] = ['overview', 'violations', 'trends', 'hotspots'];
    const currentIndex = views.indexOf(this.currentView);
    const nextIndex = (currentIndex + 1) % views.length;
    this.setView(views[nextIndex]);
  }

  /**
   * Prompt for filter input
   */
  private promptFilter(): void {
    // This is simplified - in a full implementation, you'd handle input properly
    this.emit('filter-requested');
  }

  /**
   * Get filtered violations
   */
  private getFilteredViolations() {
    if (!this.filterText) {
      return this.data.violations;
    }

    return this.data.violations.filter(violation =>
      violation.type.toLowerCase().includes(this.filterText) ||
      violation.message.toLowerCase().includes(this.filterText) ||
      violation.filePath.toLowerCase().includes(this.filterText)
    );
  }

  /**
   * Update trend data
   */
  private updateTrendData(): void {
    this.data.trendData.scores.push(this.data.complianceScore);
    this.data.trendData.timestamps.push(this.data.timestamp);
    this.data.trendData.violationCounts.push(this.data.violations.length);

    // Keep only recent data
    const maxPoints = this.options.maxHistoryPoints;
    if (this.data.trendData.scores.length > maxPoints) {
      this.data.trendData.scores = this.data.trendData.scores.slice(-maxPoints);
      this.data.trendData.timestamps = this.data.trendData.timestamps.slice(-maxPoints);
      this.data.trendData.violationCounts = this.data.trendData.violationCounts.slice(-maxPoints);
    }
  }

  /**
   * Create a progress bar
   */
  private createProgressBar(value: number, max: number, width: number): string {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    const color = value >= 90 ? chalk.green : value >= 70 ? chalk.yellow : chalk.red;
    
    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * Create mini trend line
   */
  private createMiniTrendLine(values: number[], width: number): string {
    if (values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    let line = '';
    for (let i = 0; i < Math.min(width, values.length); i++) {
      const value = values[values.length - width + i] || values[i];
      const normalized = (value - min) / range;
      
      if (normalized > 0.8) line += chalk.green('▁');
      else if (normalized > 0.6) line += chalk.yellow('▂');
      else if (normalized > 0.4) line += chalk.yellow('▃');
      else if (normalized > 0.2) line += chalk.red('▄');
      else line += chalk.red('▅');
    }

    return line;
  }

  /**
   * Create detailed trend chart
   */
  private createDetailedTrendChart(values: number[], label: string, width: number, height: number): string[] {
    if (values.length < 2) return [`No ${label.toLowerCase()} data available`];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const lines: string[] = [];
    
    // Chart header
    lines.push(`${label}: ${chalk.white.bold(values[values.length - 1].toFixed(1))} (${min.toFixed(1)}-${max.toFixed(1)})`);
    
    // Simple ASCII chart
    for (let row = height - 1; row >= 0; row--) {
      let line = '';
      const threshold = min + (range * row / (height - 1));
      
      for (let i = Math.max(0, values.length - width); i < values.length; i++) {
        const value = values[i];
        line += value >= threshold ? '█' : ' ';
      }
      
      lines.push(line);
    }

    return lines;
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Hide cursor
   */
  private hideCursor(): void {
    process.stdout.write('\x1B[?25l');
  }

  /**
   * Show cursor
   */
  private showCursor(): void {
    process.stdout.write('\x1B[?25h');
  }

  /**
   * Create empty data structure
   */
  private createEmptyData(): DashboardData {
    return {
      timestamp: Date.now(),
      complianceScore: 100,
      violations: [],
      changes: [],
      sessionStats: {
        filesWatched: 0,
        changesDetected: 0,
        violationsFound: 0,
        duration: 0,
      },
      trendData: {
        scores: [],
        timestamps: [],
        violationCounts: [],
      },
    };
  }
}