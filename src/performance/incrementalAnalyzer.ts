/**
 * Incremental analysis engine for file watching
 */

import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as path from 'path';
import { ComponentInfo, CSSAnalysisResult, HTMLAnalysisResult } from '../types';
import { ComponentAnalyzer, CSSAnalyzer, HTMLAnalyzer } from '../analyzers';

export interface FileHash {
  filePath: string;
  hash: string;
  timestamp: number;
  size: number;
}

export interface CachedAnalysis {
  filePath: string;
  result: ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult;
  hash: string;
  timestamp: number;
  dependencies?: string[];
}

export interface AnalysisChange {
  type: 'added' | 'modified' | 'deleted';
  filePath: string;
  result?: ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult;
  oldResult?: ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult;
}

export class IncrementalAnalyzer {
  private fileHashes = new Map<string, FileHash>();
  private analysisCache = new Map<string, CachedAnalysis>();
  private dependencyGraph = new Map<string, Set<string>>();
  private componentAnalyzer: ComponentAnalyzer;
  private cssAnalyzer: CSSAnalyzer;
  private htmlAnalyzer: HTMLAnalyzer;
  private maxCacheSize: number;

  constructor(maxCacheSizeMB: number = 256) {
    this.componentAnalyzer = new ComponentAnalyzer();
    this.cssAnalyzer = new CSSAnalyzer();
    this.htmlAnalyzer = new HTMLAnalyzer();
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024;
  }

  /**
   * Analyze only changed files incrementally
   */
  async analyzeChangedFiles(changedPaths: string[]): Promise<AnalysisChange[]> {
    const changes: AnalysisChange[] = [];

    // Process deletions first
    for (const filePath of changedPaths) {
      if (!(await fs.pathExists(filePath))) {
        const oldResult = this.analysisCache.get(filePath)?.result;
        if (oldResult) {
          changes.push({
            type: 'deleted',
            filePath,
            oldResult,
          });
          
          this.fileHashes.delete(filePath);
          this.analysisCache.delete(filePath);
          this.invalidateDependents(filePath);
        }
        continue;
      }

      // Check if file actually changed
      const currentHash = await this.calculateFileHash(filePath);
      const previousHash = this.fileHashes.get(filePath);
      
      if (previousHash && currentHash.hash === previousHash.hash) {
        // File hasn't actually changed (e.g., just touched)
        continue;
      }

      // Determine if this is new or modified
      const isNew = !previousHash;
      const oldResult = this.analysisCache.get(filePath)?.result;

      // Analyze the file
      try {
        const result = await this.analyzeFile(filePath);
        
        changes.push({
          type: isNew ? 'added' : 'modified',
          filePath,
          result,
          oldResult,
        });

        // Update caches
        this.fileHashes.set(filePath, currentHash);
        this.analysisCache.set(filePath, {
          filePath,
          result,
          hash: currentHash.hash,
          timestamp: Date.now(),
          dependencies: this.extractDependencies(result),
        });

        // Update dependency graph
        this.updateDependencyGraph(filePath, result);

        // Invalidate dependent files for reanalysis
        await this.invalidateDependents(filePath);

      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, error);
      }
    }

    // Cleanup cache if it's getting too large
    await this.cleanupCache();

    return changes;
  }

  /**
   * Calculate file hash for change detection
   */
  async calculateFileHash(filePath: string): Promise<FileHash> {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
      filePath,
      hash,
      timestamp: stats.mtimeMs,
      size: stats.size,
    };
  }

  /**
   * Analyze a single file based on its extension
   */
  private async analyzeFile(filePath: string): Promise<ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return await this.componentAnalyzer.parseReactComponent(filePath);
      
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return await this.cssAnalyzer.parseCSSFile(filePath);
      
      case '.html':
      case '.htm':
        return await this.htmlAnalyzer.parseHTMLFile(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Extract dependencies from analysis result
   */
  private extractDependencies(result: ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult): string[] {
    if ('dependencies' in result && result.dependencies) {
      return result.dependencies;
    }
    return [];
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(filePath: string, result: ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult): void {
    const dependencies = this.extractDependencies(result);
    
    // Clear old dependencies
    for (const [dep, dependents] of this.dependencyGraph) {
      dependents.delete(filePath);
      if (dependents.size === 0) {
        this.dependencyGraph.delete(dep);
      }
    }

    // Add new dependencies
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(filePath);
    }
  }

  /**
   * Invalidate files that depend on the changed file
   */
  private async invalidateDependents(filePath: string): Promise<void> {
    const dependents = this.dependencyGraph.get(filePath);
    if (!dependents) return;

    for (const dependent of dependents) {
      // Remove from cache to force reanalysis
      this.analysisCache.delete(dependent);
    }
  }

  /**
   * Get cached analysis result
   */
  getCachedResult(filePath: string): ComponentInfo | CSSAnalysisResult | HTMLAnalysisResult | null {
    const cached = this.analysisCache.get(filePath);
    return cached ? cached.result : null;
  }

  /**
   * Check if file needs reanalysis
   */
  async needsReanalysis(filePath: string): Promise<boolean> {
    try {
      const currentHash = await this.calculateFileHash(filePath);
      const cachedHash = this.fileHashes.get(filePath);
      
      return !cachedHash || currentHash.hash !== cachedHash.hash;
    } catch {
      return true; // If we can't check, assume it needs reanalysis
    }
  }

  /**
   * Get all cached files
   */
  getCachedFiles(): string[] {
    return Array.from(this.analysisCache.keys());
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    files: number;
    memoryUsage: number;
    hitRate: number;
    oldestEntry: number;
  } {
    const now = Date.now();
    let oldestEntry = now;
    let totalSize = 0;

    for (const cached of this.analysisCache.values()) {
      if (cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
      // Rough memory calculation
      totalSize += JSON.stringify(cached.result).length * 2; // Assuming 2 bytes per char
    }

    return {
      files: this.analysisCache.size,
      memoryUsage: totalSize,
      hitRate: 0, // Would need to track hits/misses to calculate
      oldestEntry: oldestEntry === now ? 0 : now - oldestEntry,
    };
  }

  /**
   * Clean up old cache entries to manage memory
   */
  private async cleanupCache(): Promise<void> {
    const stats = this.getCacheStats();
    
    if (stats.memoryUsage > this.maxCacheSize) {
      // Remove oldest entries until we're under the limit
      const entries = Array.from(this.analysisCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      let currentSize = stats.memoryUsage;
      const targetSize = this.maxCacheSize * 0.8; // Clean to 80% of limit
      
      for (const [filePath, cached] of entries) {
        if (currentSize <= targetSize) break;
        
        const entrySize = JSON.stringify(cached.result).length * 2;
        this.analysisCache.delete(filePath);
        this.fileHashes.delete(filePath);
        currentSize -= entrySize;
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.fileHashes.clear();
    this.analysisCache.clear();
    this.dependencyGraph.clear();
  }

  /**
   * Save cache to disk for persistence across sessions
   */
  async saveCache(projectPath: string): Promise<void> {
    const cacheDir = path.join(projectPath, '.codebase-guru');
    await fs.ensureDir(cacheDir);
    
    const cacheData = {
      fileHashes: Array.from(this.fileHashes.entries()),
      analysisCache: Array.from(this.analysisCache.entries()),
      dependencyGraph: Array.from(this.dependencyGraph.entries()).map(([key, set]) => [key, Array.from(set)]),
      timestamp: Date.now(),
    };
    
    await fs.writeJson(path.join(cacheDir, 'analysis-cache.json'), cacheData);
  }

  /**
   * Load cache from disk
   */
  async loadCache(projectPath: string): Promise<void> {
    const cachePath = path.join(projectPath, '.codebase-guru', 'analysis-cache.json');
    
    try {
      if (await fs.pathExists(cachePath)) {
        const cacheData = await fs.readJson(cachePath);
        
        // Check if cache is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - cacheData.timestamp > maxAge) {
          console.log('Cache is stale, starting fresh');
          return;
        }
        
        this.fileHashes = new Map(cacheData.fileHashes);
        this.analysisCache = new Map(cacheData.analysisCache);
        this.dependencyGraph = new Map(
          cacheData.dependencyGraph.map(([key, arr]: [string, string[]]) => [key, new Set(arr)])
        );
        
        console.log(`Loaded cache with ${this.analysisCache.size} files`);
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
      this.clearCache();
    }
  }

  /**
   * Validate cache integrity
   */
  async validateCache(): Promise<{ valid: number; invalid: string[] }> {
    const invalid: string[] = [];
    let valid = 0;
    
    for (const [filePath, cached] of this.analysisCache) {
      try {
        if (await fs.pathExists(filePath)) {
          const currentHash = await this.calculateFileHash(filePath);
          if (currentHash.hash === cached.hash) {
            valid++;
          } else {
            invalid.push(filePath);
          }
        } else {
          invalid.push(filePath);
        }
      } catch {
        invalid.push(filePath);
      }
    }
    
    // Remove invalid entries
    for (const filePath of invalid) {
      this.analysisCache.delete(filePath);
      this.fileHashes.delete(filePath);
    }
    
    return { valid, invalid };
  }
}