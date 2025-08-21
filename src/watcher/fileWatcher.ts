/**
 * File watching system with real-time drift detection
 */

import * as path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import * as notifier from 'node-notifier';
import { EventEmitter } from 'events';
import { IncrementalAnalyzer, AnalysisChange } from '../performance/incrementalAnalyzer';
import { DriftAnalyzer } from '../drift-detector/driftAnalyzer';
import { PatternExtractor, DesignPatterns } from '../patterns/patternExtractor';
import { PatternStorage } from '../patterns/patternStorage';
import { ConfigLoader, GuruConfig } from '../config/configLoader';
import { ProjectAnalysis } from '../types';
import { AnalysisStream } from '../streaming/analysisStream';
import { TerminalDashboard } from '../dashboard/terminalDashboard';

export interface WatchOptions {
  projectPath: string;
  include?: string[];
  exclude?: string[];
  debounceMs?: number;
  verbose?: boolean;
  enableNotifications?: boolean;
  enableDashboard?: boolean;
  enableStreaming?: boolean;
}

export interface WatchSession {
  startTime: number;
  filesWatched: number;
  changesDetected: number;
  violationsFound: number;
  complianceScore: number;
  lastActivity: number;
}

export interface WatchEvent {
  type: 'file-changed' | 'analysis-complete' | 'violations-detected' | 'patterns-updated';
  timestamp: number;
  data: unknown;
}

export class FileWatcher extends EventEmitter {
  private watcher?: any;
  private incrementalAnalyzer: IncrementalAnalyzer;
  private driftAnalyzer?: DriftAnalyzer;
  private patternExtractor: PatternExtractor;
  private patternStorage: PatternStorage;
  private configLoader: ConfigLoader;
  private options: WatchOptions;
  private session: WatchSession;
  private isWatching = false;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private pendingChanges = new Set<string>();
  private config?: GuruConfig;
  private patterns?: DesignPatterns;
  private analysisStream?: AnalysisStream;
  private dashboard?: TerminalDashboard;

  constructor(options: WatchOptions) {
    super();
    
    this.options = {
      debounceMs: 300,
      verbose: false,
      enableNotifications: true,
      enableDashboard: false,
      enableStreaming: true,
      ...options,
    };
    
    this.incrementalAnalyzer = new IncrementalAnalyzer();
    this.patternExtractor = new PatternExtractor();
    this.patternStorage = new PatternStorage(options.projectPath);
    this.configLoader = new ConfigLoader(options.projectPath);
    
    this.session = {
      startTime: Date.now(),
      filesWatched: 0,
      changesDetected: 0,
      violationsFound: 0,
      complianceScore: 100,
      lastActivity: Date.now(),
    };
  }

  /**
   * Start watching files for changes
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) {
      throw new Error('Already watching');
    }

    console.log(chalk.cyan('🎯 Starting React Codebase Guru - Watch Mode\n'));

    // Load configuration
    this.config = await this.configLoader.loadConfig();
    this.driftAnalyzer = new DriftAnalyzer(this.config);

    // Initialize streaming and dashboard
    if (this.options.enableStreaming) {
      this.analysisStream = new AnalysisStream({
        projectPath: this.options.projectPath,
        enableRealTimeReports: true,
      });
      this.analysisStream.start();
    }

    if (this.options.enableDashboard) {
      this.dashboard = new TerminalDashboard({
        enableKeyboardShortcuts: true,
        showTrends: true,
        showHotspots: true,
      });
      this.setupDashboardIntegration();
    }

    // Load existing patterns and cache
    await this.loadPatterns();
    await this.incrementalAnalyzer.loadCache(this.options.projectPath);

    // Validate cache
    const validation = await this.incrementalAnalyzer.validateCache();
    if (validation.invalid.length > 0) {
      console.log(chalk.yellow(`⚠️  Refreshed ${validation.invalid.length} stale cache entries`));
    }

    // Set up file patterns
    const includePatterns = this.options.include || this.config.include || [
      'src/**/*.{js,jsx,ts,tsx,css,scss,sass,less,html,htm}',
      'components/**/*.{js,jsx,ts,tsx,css,scss,sass,less}',
      'pages/**/*.{js,jsx,ts,tsx}',
    ];

    const excludePatterns = this.options.exclude || this.config.exclude || [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      'coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
    ];

    // Create watcher
    this.watcher = chokidar.watch(includePatterns, {
      cwd: this.options.projectPath,
      ignored: excludePatterns,
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Set up event handlers
    this.setupEventHandlers();

    this.isWatching = true;
    this.session.startTime = Date.now();

    console.log(chalk.green('✅ Watch mode active'));
    console.log(chalk.gray(`📁 Watching: ${this.options.projectPath}`));
    console.log(chalk.gray(`🔍 Patterns: ${includePatterns.join(', ')}`));
    console.log(chalk.gray(`⏱️  Debounce: ${this.options.debounceMs}ms`));
    console.log(chalk.gray('\n📊 Status:'));
    this.printStatus();
    console.log(chalk.gray('\nPress Ctrl+C to stop watching\n'));

    // Set up graceful shutdown
    this.setupGracefulShutdown();

    // Start dashboard if enabled
    if (this.dashboard) {
      this.dashboard.start();
    }
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    return this.stopWatching();
  }

  /**
   * Stop watching files
   */
  async stopWatching(): Promise<void> {
    if (!this.isWatching) return;

    console.log(chalk.yellow('\n🛑 Stopping watch mode...'));

    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }

    // Stop dashboard and streaming
    if (this.dashboard) {
      this.dashboard.stop();
    }
    
    if (this.analysisStream) {
      this.analysisStream.stop();
    }

    // Save cache
    await this.incrementalAnalyzer.saveCache(this.options.projectPath);

    this.isWatching = false;

    // Print session summary
    if (!this.options.enableDashboard) {
      this.printSessionSummary();
    }
    
    console.log(chalk.green('✅ Watch mode stopped'));
  }

  /**
   * Set up event handlers for file watching
   */
  private setupEventHandlers(): void {
    if (!this.watcher) return;

    this.watcher
      .on('add', (filePath: string) => this.handleFileChange('add', filePath))
      .on('change', (filePath: string) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath: string) => this.handleFileChange('unlink', filePath))
      .on('error', (error: Error) => {
        console.error(chalk.red('❌ Watcher error:'), error);
        this.emit('error', error);
      })
      .on('ready', () => {
        const watchedPaths = this.watcher!.getWatched();
        const fileCount = Object.values(watchedPaths).reduce((sum: number, files) => sum + (files as string[]).length, 0);
        this.session.filesWatched = fileCount;
        
        if (this.options.verbose) {
          console.log(chalk.green(`👀 Watching ${fileCount} files`));
        }
        
        this.emit('ready');
      });
  }

  /**
   * Handle file change events with debouncing
   */
  private handleFileChange(event: string, filePath: string): void {
    const fullPath = path.resolve(this.options.projectPath, filePath);
    
    if (this.options.verbose) {
      console.log(chalk.gray(`📝 ${event}: ${filePath}`));
    }

    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(fullPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Add to pending changes
    this.pendingChanges.add(fullPath);

    // Set up debounced analysis
    const timer = setTimeout(() => {
      this.debounceTimers.delete(fullPath);
      this.processPendingChanges();
    }, this.options.debounceMs);

    this.debounceTimers.set(fullPath, timer);
    this.session.lastActivity = Date.now();
  }

  /**
   * Process pending file changes
   */
  private async processPendingChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) return;

    const changedFiles = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    try {
      console.log(chalk.blue(`🔄 Analyzing ${changedFiles.length} changed file(s)...`));

      const startTime = Date.now();

      // Incremental analysis
      const changes = await this.incrementalAnalyzer.analyzeChangedFiles(changedFiles);
      this.session.changesDetected += changes.length;

      if (changes.length === 0) {
        if (!this.options.enableDashboard) {
          console.log(chalk.gray('   No actual changes detected'));
        }
        return;
      }

      // Process changes in stream
      if (this.analysisStream) {
        this.analysisStream.processChanges(changes);
      }

      // Update patterns if needed
      await this.updatePatterns(changes);

      // Perform drift analysis
      const driftResult = await this.performDriftAnalysis(changes);
      const analysisTime = Date.now() - startTime;

      // Process analysis result in stream
      if (this.analysisStream && driftResult) {
        this.analysisStream.processAnalysisResult(driftResult, analysisTime);
      }

      // Update dashboard
      this.updateDashboard(changes, driftResult);

      // Emit event
      this.emit('analysis-complete', { changes, session: this.session });

      // Update status display
      if (!this.options.enableDashboard) {
        this.updateStatusDisplay();
      }

    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error);
    }
  }

  /**
   * Update patterns based on file changes
   */
  private async updatePatterns(changes: AnalysisChange[]): Promise<void> {
    // Check if we need to update patterns (new files or significant changes)
    const significantChanges = changes.filter(c => 
      c.type === 'added' || 
      (c.type === 'modified' && this.isSignificantChange(c))
    );

    if (significantChanges.length === 0) return;

    if (this.options.verbose) {
      console.log(chalk.blue('🔍 Updating design patterns...'));
    }

    // Re-extract patterns (could be optimized to only analyze changed components)
    const cachedFiles = this.incrementalAnalyzer.getCachedFiles();
    const allResults = {
      components: [],
      styles: [],
      templates: [],
    } as { 
      components: any[], 
      styles: any[], 
      templates: any[] 
    };

    for (const filePath of cachedFiles) {
      const result = this.incrementalAnalyzer.getCachedResult(filePath);
      if (!result || !result.success) continue;

      const ext = path.extname(filePath).toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        allResults.components.push(result);
      } else if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
        allResults.styles.push(result);
      } else if (['.html', '.htm'].includes(ext)) {
        allResults.templates.push(result);
      }
    }

    // Extract new patterns
    const tempAnalysis: ProjectAnalysis = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework: { type: 'react', typescript: false },
      components: allResults.components,
      styles: allResults.styles,
      templates: allResults.templates,
      patterns: [],
      violations: [],
      compliance: { score: 0, totalFiles: 0, filesWithViolations: 0, totalViolations: 0 },
    };

    this.patterns = this.patternExtractor.extractPatterns(tempAnalysis);
    await this.patternStorage.savePatterns(this.patterns);

    if (this.driftAnalyzer) {
      this.driftAnalyzer.setPatterns(this.patterns);
    }

    this.emit('patterns-updated', this.patterns);
  }

  /**
   * Perform drift analysis on changes
   */
  private async performDriftAnalysis(changes: AnalysisChange[]): Promise<any> {
    if (!this.driftAnalyzer) return null;

    // Create minimal analysis for drift detection
    const tempAnalysis: ProjectAnalysis = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework: { type: 'react', typescript: false },
      components: changes.filter(c => c.result && ['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(c.filePath))).map(c => c.result!) as any[],
      styles: changes.filter(c => c.result && ['.css', '.scss', '.sass', '.less'].includes(path.extname(c.filePath))).map(c => c.result!) as any[],
      templates: changes.filter(c => c.result && ['.html', '.htm'].includes(path.extname(c.filePath))).map(c => c.result!) as any[],
      patterns: [],
      violations: [],
      compliance: { score: 0, totalFiles: 0, filesWithViolations: 0, totalViolations: 0 },
    };

    const driftResult = this.driftAnalyzer.analyzeForDrift(tempAnalysis);
    const newViolations = driftResult.violations;

    if (newViolations.length > 0) {
      this.session.violationsFound += newViolations.length;
      this.session.complianceScore = driftResult.complianceScore;

      console.log(chalk.red(`⚠️  Found ${newViolations.length} violation(s):`));
      for (const violation of newViolations.slice(0, 3)) {
        console.log(chalk.red(`   • ${violation.type}: ${violation.message}`));
        if (violation.suggestedFix) {
          console.log(chalk.gray(`     💡 ${violation.suggestedFix}`));
        }
      }
      if (newViolations.length > 3) {
        console.log(chalk.gray(`   ... and ${newViolations.length - 3} more`));
      }

      // Show desktop notification if enabled
      if (this.options.enableNotifications) {
        this.showNotification(`Found ${newViolations.length} drift violation(s)`, 
                            newViolations[0].message);
      }

      this.emit('drift-detected', changes);
      this.emit('violations-detected', { violations: newViolations, changes });
    } else {
      if (!this.options.enableDashboard) {
        console.log(chalk.green('✅ No violations detected'));
      }
    }

    return driftResult;
  }

  /**
   * Load existing patterns
   */
  private async loadPatterns(): Promise<void> {
    const storedPatterns = await this.patternStorage.loadPatterns();
    if (storedPatterns) {
      this.patterns = storedPatterns.patterns;
      if (this.driftAnalyzer) {
        this.driftAnalyzer.setPatterns(this.patterns);
      }
      console.log(chalk.green('✅ Loaded existing design patterns'));
    }
  }

  /**
   * Check if change is significant enough to update patterns
   */
  private isSignificantChange(change: AnalysisChange): boolean {
    // Simple heuristic - could be made more sophisticated
    if (!change.result || !change.oldResult) return true;
    
    // Compare result sizes as a proxy for significance
    const newSize = JSON.stringify(change.result).length;
    const oldSize = JSON.stringify(change.oldResult).length;
    const sizeDiff = Math.abs(newSize - oldSize) / oldSize;
    
    return sizeDiff > 0.1; // 10% change threshold
  }

  /**
   * Update status display
   */
  private updateStatusDisplay(): void {
    // Clear console and reprint status (could be made more sophisticated)
    if (!this.options.verbose) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      this.printStatus();
    }
  }

  /**
   * Setup dashboard integration
   */
  private setupDashboardIntegration(): void {
    if (!this.dashboard) return;

    // Handle dashboard events
    this.dashboard.on('filter-requested', () => {
      // This would handle filter input in a full implementation
      console.log('\nFilter functionality would be implemented here');
    });

    this.dashboard.on('stopped', () => {
      this.stop();
    });
  }

  /**
   * Update dashboard with analysis data
   */
  private updateDashboard(changes: AnalysisChange[], driftResult: any): void {
    if (!this.dashboard) return;

    this.dashboard.updateData({
      complianceScore: driftResult?.complianceScore || 100,
      violations: driftResult?.violations || [],
      changes,
      sessionStats: this.getSessionStats(),
    });
  }

  /**
   * Print current status
   */
  private printStatus(): void {
    const uptime = Math.round((Date.now() - this.session.startTime) / 1000);
    const cacheStats = this.incrementalAnalyzer.getCacheStats();
    
    console.log(chalk.gray([
      `⏱️  Uptime: ${uptime}s`,
      `📁 Files: ${this.session.filesWatched}`,
      `🔄 Changes: ${this.session.changesDetected}`,
      `⚠️  Violations: ${this.session.violationsFound}`,
      `📊 Score: ${this.session.complianceScore}%`,
      `💾 Cache: ${cacheStats.files} files`,
    ].join(' | ')));
  }

  /**
   * Print session summary
   */
  private printSessionSummary(): void {
    const duration = Math.round((Date.now() - this.session.startTime) / 1000);
    const cacheStats = this.incrementalAnalyzer.getCacheStats();
    
    console.log(chalk.cyan('\n📊 Watch Session Summary'));
    console.log(chalk.gray(`   Duration: ${duration}s`));
    console.log(chalk.gray(`   Files watched: ${this.session.filesWatched}`));
    console.log(chalk.gray(`   Changes detected: ${this.session.changesDetected}`));
    console.log(chalk.gray(`   Violations found: ${this.session.violationsFound}`));
    console.log(chalk.gray(`   Final compliance: ${this.session.complianceScore}%`));
    console.log(chalk.gray(`   Cache entries: ${cacheStats.files}`));
    console.log(chalk.gray(`   Memory used: ${Math.round(cacheStats.memoryUsage / 1024)}KB`));
  }


  /**
   * Set up graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      await this.stopWatching();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }


  /**
   * Get current session info
   */
  getSession(): WatchSession {
    return { ...this.session };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.incrementalAnalyzer.getCacheStats();
  }

  /**
   * Force refresh of all patterns
   */
  async refreshPatterns(): Promise<void> {
    console.log(chalk.blue('🔄 Refreshing design patterns...'));
    
    // Clear cache to force reanalysis
    this.incrementalAnalyzer.clearCache();
    
    // Trigger reanalysis of all files
    await this.processPendingChanges();
    
    console.log(chalk.green('✅ Patterns refreshed'));
  }

  /**
   * Get session statistics for CLI
   */
  getSessionStats(): {
    filesWatched: number;
    changesDetected: number;
    violationsFound: number;
    duration: number;
  } {
    return {
      filesWatched: this.session.filesWatched,
      changesDetected: this.session.changesDetected,
      violationsFound: this.session.violationsFound,
      duration: Date.now() - this.session.startTime,
    };
  }

  /**
   * Show desktop notification
   */
  private showNotification(title: string, message: string): void {
    try {
      notifier.notify({
        title: 'React Codebase Guru',
        subtitle: title,
        message: message,
        icon: path.join(__dirname, '../../assets/icon.png'),
        sound: false,
        timeout: 5,
        wait: false,
      });
    } catch (error) {
      // Silently fail if notifications aren't available
      if (this.options.verbose) {
        console.warn('Desktop notifications not available:', error);
      }
    }
  }

}