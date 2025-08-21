/**
 * Pattern storage and retrieval system
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { DesignPatterns } from './patternExtractor';
import { PatternInfo } from '../types';

export interface StoredPatterns {
  version: string;
  timestamp: string;
  projectPath: string;
  patterns: DesignPatterns;
  history?: PatternHistory[];
}

export interface PatternHistory {
  timestamp: string;
  patterns: DesignPatterns;
  changes?: PatternChange[];
}

export interface PatternChange {
  type: 'added' | 'removed' | 'modified';
  category: string;
  description: string;
}

export class PatternStorage {
  private storagePath: string;
  private historyLimit: number;

  constructor(projectPath: string, historyLimit: number = 10) {
    this.storagePath = path.join(projectPath, '.codebase-guru', 'patterns.json');
    this.historyLimit = historyLimit;
  }

  /**
   * Save patterns to storage
   */
  async savePatterns(patterns: DesignPatterns): Promise<void> {
    await fs.ensureDir(path.dirname(this.storagePath));

    const existing = await this.loadPatterns();
    const timestamp = new Date().toISOString();

    const stored: StoredPatterns = {
      version: '1.0.0',
      timestamp,
      projectPath: path.dirname(path.dirname(this.storagePath)),
      patterns,
      history: existing?.history || [],
    };

    // Add current patterns to history if they differ
    if (existing && this.patternsChanged(existing.patterns, patterns)) {
      const changes = this.detectChanges(existing.patterns, patterns);
      
      stored.history = [
        {
          timestamp: existing.timestamp,
          patterns: existing.patterns,
          changes,
        },
        ...(existing.history || []),
      ].slice(0, this.historyLimit);
    }

    await fs.writeJson(this.storagePath, stored, { spaces: 2 });
  }

  /**
   * Load patterns from storage
   */
  async loadPatterns(): Promise<StoredPatterns | null> {
    try {
      if (await fs.pathExists(this.storagePath)) {
        return await fs.readJson(this.storagePath);
      }
    } catch (error) {
      console.warn('Failed to load patterns:', error);
    }
    return null;
  }

  /**
   * Check if patterns have changed
   */
  private patternsChanged(old: DesignPatterns, current: DesignPatterns): boolean {
    return JSON.stringify(old) !== JSON.stringify(current);
  }

  /**
   * Detect changes between pattern versions
   */
  private detectChanges(old: DesignPatterns, current: DesignPatterns): PatternChange[] {
    const changes: PatternChange[] = [];

    // Check spacing changes
    if (old.spacing.unit !== current.spacing.unit) {
      changes.push({
        type: 'modified',
        category: 'spacing',
        description: `Spacing unit changed from ${old.spacing.unit}px to ${current.spacing.unit}px`,
      });
    }

    // Check color changes
    const oldPrimaryColors = new Set(old.colors.primary);
    const currentPrimaryColors = new Set(current.colors.primary);
    
    for (const color of currentPrimaryColors) {
      if (!oldPrimaryColors.has(color)) {
        changes.push({
          type: 'added',
          category: 'colors',
          description: `Added primary color: ${color}`,
        });
      }
    }

    for (const color of oldPrimaryColors) {
      if (!currentPrimaryColors.has(color)) {
        changes.push({
          type: 'removed',
          category: 'colors',
          description: `Removed primary color: ${color}`,
        });
      }
    }

    // Check component changes
    const oldComponents = new Map(old.components.map(c => [c.name, c]));
    const currentComponents = new Map(current.components.map(c => [c.name, c]));

    for (const [name, component] of currentComponents) {
      if (!oldComponents.has(name)) {
        changes.push({
          type: 'added',
          category: 'components',
          description: `Added component: ${name}`,
        });
      } else {
        const oldComp = oldComponents.get(name)!;
        if (oldComp.usage !== component.usage) {
          changes.push({
            type: 'modified',
            category: 'components',
            description: `${name} usage changed from ${oldComp.usage} to ${component.usage}`,
          });
        }
      }
    }

    for (const [name] of oldComponents) {
      if (!currentComponents.has(name)) {
        changes.push({
          type: 'removed',
          category: 'components',
          description: `Removed component: ${name}`,
        });
      }
    }

    // Check typography changes
    if (old.typography.fontSizes.length !== current.typography.fontSizes.length) {
      changes.push({
        type: 'modified',
        category: 'typography',
        description: `Font size scale changed from ${old.typography.fontSizes.length} to ${current.typography.fontSizes.length} sizes`,
      });
    }

    return changes;
  }

  /**
   * Convert patterns to PatternInfo array for reporting
   */
  convertToPatternInfo(patterns: DesignPatterns): PatternInfo[] {
    const patternInfos: PatternInfo[] = [];

    // Add spacing pattern
    if (patterns.spacing.confidence > 0) {
      patternInfos.push({
        type: 'spacing',
        name: `${patterns.spacing.unit}px grid`,
        occurrences: patterns.spacing.values.length,
        files: [],
        confidence: patterns.spacing.confidence,
      });
    }

    // Add color patterns
    for (const color of patterns.colors.primary) {
      patternInfos.push({
        type: 'color',
        name: `Primary: ${color}`,
        occurrences: 1,
        files: [],
        confidence: 100,
      });
    }

    // Add typography patterns
    for (const size of patterns.typography.fontSizes) {
      patternInfos.push({
        type: 'typography',
        name: `Font size: ${size}`,
        occurrences: 1,
        files: [],
        confidence: 100,
      });
    }

    // Add component patterns
    for (const component of patterns.components) {
      patternInfos.push({
        type: 'component',
        name: component.name,
        occurrences: component.usage,
        files: component.locations,
        confidence: 100,
      });
    }

    return patternInfos;
  }

  /**
   * Get pattern history
   */
  async getHistory(): Promise<PatternHistory[]> {
    const stored = await this.loadPatterns();
    return stored?.history || [];
  }

  /**
   * Clear pattern storage
   */
  async clearPatterns(): Promise<void> {
    if (await fs.pathExists(this.storagePath)) {
      await fs.remove(this.storagePath);
    }
  }

  /**
   * Export patterns to different formats
   */
  async exportPatterns(format: 'json' | 'css' | 'scss' = 'json'): Promise<string> {
    const stored = await this.loadPatterns();
    if (!stored) {
      throw new Error('No patterns found');
    }

    switch (format) {
      case 'css':
        return this.exportAsCSS(stored.patterns);
      case 'scss':
        return this.exportAsSCSS(stored.patterns);
      default:
        return JSON.stringify(stored.patterns, null, 2);
    }
  }

  /**
   * Export patterns as CSS variables
   */
  private exportAsCSS(patterns: DesignPatterns): string {
    let css = ':root {\n';

    // Spacing
    css += `  /* Spacing Grid: ${patterns.spacing.unit}px */\n`;
    patterns.spacing.values.forEach((value, index) => {
      css += `  --spacing-${index}: ${value}px;\n`;
    });

    // Colors
    css += '\n  /* Primary Colors */\n';
    patterns.colors.primary.forEach((color, index) => {
      css += `  --color-primary-${index}: ${color};\n`;
    });

    css += '\n  /* Neutral Colors */\n';
    patterns.colors.neutrals.forEach((color, index) => {
      css += `  --color-neutral-${index}: ${color};\n`;
    });

    // Typography
    css += '\n  /* Typography Scale */\n';
    patterns.typography.fontSizes.forEach((size, index) => {
      css += `  --font-size-${index}: ${size};\n`;
    });

    patterns.typography.fontWeights.forEach((weight, index) => {
      css += `  --font-weight-${index}: ${weight};\n`;
    });

    css += '}\n';
    return css;
  }

  /**
   * Export patterns as SCSS variables
   */
  private exportAsSCSS(patterns: DesignPatterns): string {
    let scss = '// Design System Patterns\n\n';

    // Spacing
    scss += `// Spacing Grid: ${patterns.spacing.unit}px\n`;
    scss += `$spacing-unit: ${patterns.spacing.unit}px;\n`;
    patterns.spacing.values.forEach((value, index) => {
      scss += `$spacing-${index}: ${value}px;\n`;
    });

    // Colors
    scss += '\n// Primary Colors\n';
    patterns.colors.primary.forEach((color, index) => {
      scss += `$color-primary-${index}: ${color};\n`;
    });

    scss += '\n// Neutral Colors\n';
    patterns.colors.neutrals.forEach((color, index) => {
      scss += `$color-neutral-${index}: ${color};\n`;
    });

    // Typography
    scss += '\n// Typography Scale\n';
    patterns.typography.fontSizes.forEach((size, index) => {
      scss += `$font-size-${index}: ${size};\n`;
    });

    patterns.typography.fontWeights.forEach((weight, index) => {
      scss += `$font-weight-${index}: ${weight};\n`;
    });

    return scss;
  }
}