/**
 * Error handling utilities for file analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ErrorResult, SkippedResult } from '../types';

export class AnalysisErrorHandler {
  private maxFileSize: number;
  private allowedExtensions: Set<string>;

  constructor(maxFileSizeMB: number = 5) {
    this.maxFileSize = maxFileSizeMB * 1024 * 1024;
    this.allowedExtensions = new Set([
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.css',
      '.scss',
      '.sass',
      '.less',
      '.html',
      '.htm',
    ]);
  }

  /**
   * Safely parse a file with error handling
   */
  async safeParseFile<T>(
    filePath: string,
    parser: (filePath: string) => Promise<T>
  ): Promise<T | ErrorResult | SkippedResult> {
    try {
      // Validate file path
      if (!this.isValidFilePath(filePath)) {
        return this.createSkippedResult(filePath, 'Invalid file path');
      }

      // Check file stats
      const stats = await fs.stat(filePath);

      // Skip files that are too large
      if (stats.size > this.maxFileSize) {
        return this.createSkippedResult(filePath, `File too large (${Math.round(stats.size / 1024 / 1024)}MB)`);
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!this.allowedExtensions.has(ext)) {
        return this.createSkippedResult(filePath, `Unsupported file extension: ${ext}`);
      }

      // Check file encoding
      if (!(await this.isValidEncoding(filePath))) {
        return this.createSkippedResult(filePath, 'Invalid file encoding');
      }

      // Parse the file
      return await parser(filePath);
    } catch (error) {
      return this.handleParsingError(filePath, error as Error);
    }
  }

  /**
   * Check if file path is valid
   */
  private isValidFilePath(filePath: string): boolean {
    try {
      path.resolve(filePath); // Validate path can be resolved
      // Basic security check - ensure path doesn't contain suspicious patterns
      if (filePath.includes('..') || filePath.includes('~')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if file has valid encoding
   */
  private async isValidEncoding(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      // Check for binary content
      for (let i = 0; i < Math.min(buffer.length, 8000); i++) {
        const byte = buffer[i];
        // Check for null bytes or other binary indicators
        if (byte === 0) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle parsing errors
   */
  private handleParsingError(filePath: string, error: Error): ErrorResult {
    const errorTypes: Record<string, string> = {
      SyntaxError: 'syntax-error',
      ENOENT: 'file-not-found',
      EACCES: 'permission-denied',
      EMFILE: 'too-many-files',
      ENOTDIR: 'not-a-directory',
      EISDIR: 'is-a-directory',
    };

    const errorCode = (error as NodeJS.ErrnoException).code;
    const errorType = errorTypes[errorCode || ''] || errorTypes[error.constructor.name] || 'unknown';

    console.warn(`⚠️  Failed to parse ${filePath}: ${error.message}`);

    return {
      filePath,
      success: false,
      errorType,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a skipped result
   */
  private createSkippedResult(filePath: string, reason: string): SkippedResult {
    return {
      filePath,
      success: false,
      skipped: true,
      reason,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Memory management for large projects
 */
export class MemoryManager {
  private maxMemory: number;
  private cache: Map<string, { data: unknown; size: number; timestamp: number }>;
  private cacheSize: number;

  constructor(maxMemoryMB: number = 512) {
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.cache = new Map();
    this.cacheSize = 0;
  }

  /**
   * Add data to cache with memory management
   */
  addToCache(key: string, data: unknown): void {
    const size = this.calculateSize(data);

    if (this.cacheSize + size > this.maxMemory) {
      this.evictOldestEntries(size);
    }

    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.cacheSize += size;
  }

  /**
   * Get data from cache
   */
  getFromCache(key: string): unknown | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update timestamp on access (LRU)
      entry.timestamp = Date.now();
      return entry.data;
    }
    return undefined;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: unknown): number {
    // Rough estimation - can be improved
    const str = JSON.stringify(data);
    return str.length * 2; // Assuming 2 bytes per character
  }

  /**
   * Evict oldest cache entries to make room
   */
  private evictOldestEntries(neededSize: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    let freedSize = 0;
    for (const [key, value] of entries) {
      this.cache.delete(key);
      this.cacheSize -= value.size;
      freedSize += value.size;

      if (freedSize >= neededSize) break;
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; sizeBytes: number; sizeMB: number } {
    return {
      entries: this.cache.size,
      sizeBytes: this.cacheSize,
      sizeMB: Math.round(this.cacheSize / 1024 / 1024),
    };
  }
}