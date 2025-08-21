/**
 * Drift detection and analysis engine
 */

import {
  ComponentInfo,
  CSSAnalysisResult,
  HTMLAnalysisResult,
  DriftViolation,
  ProjectAnalysis,
} from '../types';
import { DesignPatterns } from '../patterns/patternExtractor';
import { GuruConfig } from '../config/configLoader';

export interface DriftAnalysisResult {
  violations: DriftViolation[];
  complianceScore: number;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    byType: Record<string, number>;
  };
}

export class DriftAnalyzer {
  private config: GuruConfig;
  private patterns: DesignPatterns | null = null;

  constructor(config: GuruConfig) {
    this.config = config;
  }

  /**
   * Set learned patterns for drift detection
   */
  setPatterns(patterns: DesignPatterns): void {
    this.patterns = patterns;
  }

  /**
   * Analyze project for drift violations
   */
  analyzeForDrift(analysis: ProjectAnalysis): DriftAnalysisResult {
    const violations: DriftViolation[] = [];

    // Component-related violations
    violations.push(...this.detectComponentDuplication(analysis.components));
    violations.push(...this.detectInlineStyles(analysis.components));
    violations.push(...this.detectNamingViolations(analysis.components));

    // CSS-related violations
    violations.push(...this.detectHardcodedColors(analysis.styles));
    violations.push(...this.detectSpacingViolations(analysis.styles));
    violations.push(...this.detectTypographyViolations(analysis.styles));

    // HTML-related violations
    violations.push(...this.detectHTMLViolations(analysis.templates));
    violations.push(...this.detectAccessibilityViolations(analysis.templates));

    // Pattern-based violations (if patterns are set)
    if (this.patterns) {
      violations.push(...this.detectPatternViolations(analysis));
    }

    // Filter violations based on config rules
    const filteredViolations = this.filterViolations(violations);

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(analysis, filteredViolations);

    // Create summary
    const summary = this.createSummary(filteredViolations);

    return {
      violations: filteredViolations,
      complianceScore,
      summary,
    };
  }

  /**
   * Detect component duplication
   */
  private detectComponentDuplication(components: ComponentInfo[]): DriftViolation[] {
    const violations: DriftViolation[] = [];
    const componentMap = new Map<string, ComponentInfo[]>();

    // Group components by name
    for (const component of components) {
      if (!component.success) continue;
      
      const key = component.name.toLowerCase();
      if (!componentMap.has(key)) {
        componentMap.set(key, []);
      }
      componentMap.get(key)!.push(component);
    }

    // Check for common button/card patterns that should use existing components
    const commonPatterns = ['button', 'card', 'modal', 'dropdown', 'tab', 'form'];
    
    for (const component of components) {
      if (!component.success) continue;

      // Check if component name suggests it's a custom implementation
      const nameLower = component.name.toLowerCase();
      
      for (const pattern of commonPatterns) {
        if (nameLower.includes(pattern) && nameLower !== pattern) {
          // Check if there's a base component
          const baseComponent = componentMap.get(pattern);
          if (baseComponent && baseComponent.length > 0) {
            violations.push({
              type: 'component-duplication',
              severity: this.getSeverity('component-duplication'),
              filePath: component.filePath,
              message: `Component "${component.name}" appears to be a variation of "${pattern}". Consider using the existing ${pattern} component with props/variants.`,
              suggestedFix: `Use the existing ${pattern} component and extend it with props or composition`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Detect inline styles
   */
  private detectInlineStyles(components: ComponentInfo[]): DriftViolation[] {
    const violations: DriftViolation[] = [];

    for (const component of components) {
      if (!component.success) continue;

      if (component.styling?.type === 'inline') {
        violations.push({
          type: 'inline-styles',
          severity: this.getSeverity('inline-styles'),
          filePath: component.filePath,
          message: 'Component uses inline styles instead of design system classes or styled-components',
          suggestedFix: 'Move styles to CSS classes, CSS modules, or styled-components',
        });
      }

      // Check for inline style patterns in component (rough detection)
      if (component.styling?.colors && component.styling.colors.length > 0) {
        for (const color of component.styling.colors) {
          if (!color.startsWith('var(') && !color.includes('current')) {
            violations.push({
              type: 'inline-styles',
              severity: this.getSeverity('inline-styles'),
              filePath: component.filePath,
              message: `Inline style with hardcoded color: ${color}`,
              suggestedFix: 'Use CSS variables or theme tokens for colors',
            });
            break; // One violation per file is enough
          }
        }
      }
    }

    return violations;
  }

  /**
   * Detect naming convention violations
   */
  private detectNamingViolations(components: ComponentInfo[]): DriftViolation[] {
    const violations: DriftViolation[] = [];
    const expectedNaming = this.config.patterns?.componentNaming || 'PascalCase';

    for (const component of components) {
      if (!component.success) continue;

      let isValid = false;
      
      switch (expectedNaming) {
        case 'PascalCase':
          isValid = /^[A-Z][a-zA-Z0-9]*$/.test(component.name);
          break;
        case 'camelCase':
          isValid = /^[a-z][a-zA-Z0-9]*$/.test(component.name);
          break;
        case 'kebab-case':
          isValid = /^[a-z]+(-[a-z]+)*$/.test(component.name);
          break;
      }

      if (!isValid) {
        violations.push({
          type: 'naming-convention',
          severity: this.getSeverity('naming-convention'),
          filePath: component.filePath,
          message: `Component "${component.name}" doesn't follow ${expectedNaming} naming convention`,
          suggestedFix: `Rename component to follow ${expectedNaming} convention`,
        });
      }
    }

    return violations;
  }

  /**
   * Detect hardcoded colors
   */
  private detectHardcodedColors(styles: CSSAnalysisResult[]): DriftViolation[] {
    const violations: DriftViolation[] = [];

    for (const style of styles) {
      if (!style.success) continue;

      const hardcodedColors = style.colors.filter(color => {
        // Allow CSS variables and currentColor
        if (color.startsWith('var(') || color === 'currentColor' || color === 'transparent') {
          return false;
        }
        
        // Allow inherit and initial
        if (color === 'inherit' || color === 'initial') {
          return false;
        }

        // Check if it's a hardcoded hex, rgb, or hsl color
        return color.startsWith('#') || 
               color.startsWith('rgb') || 
               color.startsWith('hsl');
      });

      if (hardcodedColors.length > 0) {
        violations.push({
          type: 'hardcoded-colors',
          severity: this.getSeverity('hardcoded-colors'),
          filePath: style.filePath,
          message: `Found ${hardcodedColors.length} hardcoded colors: ${hardcodedColors.slice(0, 3).join(', ')}${hardcodedColors.length > 3 ? '...' : ''}`,
          suggestedFix: 'Use CSS variables or design tokens for colors',
        });
      }
    }

    return violations;
  }

  /**
   * Detect spacing violations
   */
  private detectSpacingViolations(styles: CSSAnalysisResult[]): DriftViolation[] {
    const violations: DriftViolation[] = [];
    const spacingGrid = this.patterns?.spacing.unit || this.config.patterns?.spacingGrid || 8;

    for (const style of styles) {
      if (!style.success) continue;

      const invalidSpacing = style.spacing.filter(spacing => {
        // Parse to pixels
        const value = this.parseSpacingValue(spacing);
        if (value === null || value === 0) return false;

        // Check if it fits the grid
        return value % spacingGrid !== 0;
      });

      if (invalidSpacing.length > 0) {
        violations.push({
          type: 'spacing-violation',
          severity: this.getSeverity('spacing-violation'),
          filePath: style.filePath,
          message: `Found ${invalidSpacing.length} spacing values that don't follow the ${spacingGrid}px grid: ${invalidSpacing.slice(0, 3).join(', ')}`,
          suggestedFix: `Use multiples of ${spacingGrid}px for spacing`,
        });
      }
    }

    return violations;
  }

  /**
   * Detect typography violations
   */
  private detectTypographyViolations(styles: CSSAnalysisResult[]): DriftViolation[] {
    const violations: DriftViolation[] = [];

    if (!this.patterns) return violations;

    const allowedSizes = new Set(this.patterns.typography.fontSizes);
    const allowedWeights = new Set(this.patterns.typography.fontWeights);

    for (const style of styles) {
      if (!style.success) continue;

      // Check font sizes
      const invalidSizes = style.fontSize.filter(size => !allowedSizes.has(size));
      if (invalidSizes.length > 0) {
        violations.push({
          type: 'typography-violation',
          severity: 'warning',
          filePath: style.filePath,
          message: `Font sizes not in design scale: ${invalidSizes.join(', ')}`,
          suggestedFix: `Use established font sizes: ${Array.from(allowedSizes).join(', ')}`,
        });
      }

      // Check font weights
      const invalidWeights = style.fontWeight.filter(weight => !allowedWeights.has(weight));
      if (invalidWeights.length > 0) {
        violations.push({
          type: 'typography-violation',
          severity: 'warning',
          filePath: style.filePath,
          message: `Font weights not in design scale: ${invalidWeights.join(', ')}`,
          suggestedFix: `Use established font weights: ${Array.from(allowedWeights).join(', ')}`,
        });
      }
    }

    return violations;
  }

  /**
   * Detect HTML violations
   */
  private detectHTMLViolations(templates: HTMLAnalysisResult[]): DriftViolation[] {
    const violations: DriftViolation[] = [];

    for (const template of templates) {
      if (!template.success) continue;

      // Check for inline styles
      if (template.inlineStyles.length > 0) {
        violations.push({
          type: 'inline-styles',
          severity: this.getSeverity('inline-styles'),
          filePath: template.filePath,
          message: `Found ${template.inlineStyles.length} elements with inline styles`,
          suggestedFix: 'Move inline styles to CSS classes',
        });
      }

      // Check for custom button elements
      const buttons = template.elements.filter(e => e.tagName === 'button');
      if (buttons.length > 0) {
        for (const button of buttons) {
          if (!button.attributes.class?.includes('btn')) {
            violations.push({
              type: 'component-drift',
              severity: 'warning',
              filePath: template.filePath,
              message: 'Native button element found without design system classes',
              suggestedFix: 'Use Button component or apply design system button classes',
            });
            break; // One per file
          }
        }
      }
    }

    return violations;
  }

  /**
   * Detect accessibility violations
   */
  private detectAccessibilityViolations(templates: HTMLAnalysisResult[]): DriftViolation[] {
    const violations: DriftViolation[] = [];

    for (const template of templates) {
      if (!template.success) continue;

      if (template.accessibility.missingLabels.length > 0) {
        violations.push({
          type: 'accessibility',
          severity: this.getSeverity('accessibility'),
          filePath: template.filePath,
          message: `Missing labels for ${template.accessibility.missingLabels.length} interactive elements`,
          suggestedFix: 'Add aria-label or proper label elements for accessibility',
        });
      }

      if (template.accessibility.missingAlts.length > 0) {
        violations.push({
          type: 'accessibility',
          severity: this.getSeverity('accessibility'),
          filePath: template.filePath,
          message: `Missing alt text for ${template.accessibility.missingAlts.length} images`,
          suggestedFix: 'Add alt attributes to all images for accessibility',
        });
      }
    }

    return violations;
  }

  /**
   * Detect pattern-based violations
   */
  private detectPatternViolations(analysis: ProjectAnalysis): DriftViolation[] {
    const violations: DriftViolation[] = [];

    if (!this.patterns) return violations;

    // Check if new colors are being introduced
    const establishedColors = new Set([
      ...this.patterns.colors.primary,
      ...this.patterns.colors.secondary,
      ...this.patterns.colors.neutrals,
    ]);

    for (const style of analysis.styles) {
      if (!style.success) continue;

      const newColors = style.colors.filter(color => {
        if (color.startsWith('var(')) return false;
        const normalized = this.normalizeColor(color);
        return normalized && !establishedColors.has(normalized);
      });

      if (newColors.length > 0) {
        violations.push({
          type: 'color-drift',
          severity: 'warning',
          filePath: style.filePath,
          message: `Introducing new colors not in design system: ${newColors.slice(0, 3).join(', ')}`,
          suggestedFix: 'Use established color palette or update design system',
        });
      }
    }

    return violations;
  }

  /**
   * Filter violations based on config rules
   */
  private filterViolations(violations: DriftViolation[]): DriftViolation[] {
    return violations.filter(violation => {
      const severity = this.config.rules?.[violation.type];
      return severity !== 'off';
    });
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    analysis: ProjectAnalysis,
    violations: DriftViolation[]
  ): number {
    const totalFiles = 
      analysis.components.length + 
      analysis.styles.length + 
      analysis.templates.length;

    if (totalFiles === 0) return 100;

    const filesWithViolations = new Set(violations.map(v => v.filePath)).size;
    const violationRate = filesWithViolations / totalFiles;

    // Score based on violation rate and severity
    let score = 100 * (1 - violationRate);

    // Penalize for errors more than warnings
    const errors = violations.filter(v => v.severity === 'error').length;
    const warnings = violations.filter(v => v.severity === 'warning').length;

    score -= errors * 5; // 5 points per error
    score -= warnings * 2; // 2 points per warning

    return Math.max(0, Math.round(score));
  }

  /**
   * Create violation summary
   */
  private createSummary(violations: DriftViolation[]): DriftAnalysisResult['summary'] {
    const byType: Record<string, number> = {};

    for (const violation of violations) {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
    }

    return {
      total: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      byType,
    };
  }

  /**
   * Get severity for a rule
   */
  private getSeverity(ruleName: string): 'error' | 'warning' | 'info' {
    const severity = this.config.rules?.[ruleName] || 'warning';
    if (severity === 'off') return 'info';
    return severity as 'error' | 'warning';
  }

  /**
   * Parse spacing value to pixels
   */
  private parseSpacingValue(value: string): number | null {
    if (value.endsWith('px')) {
      return parseInt(value);
    }
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16;
    }
    if (value.endsWith('em')) {
      return parseFloat(value) * 16;
    }
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Normalize color for comparison
   */
  private normalizeColor(color: string): string | null {
    if (color.startsWith('#')) {
      return color.toLowerCase();
    }
    if (color.match(/^(rgb|rgba|hsl|hsla)\(/)) {
      return color.replace(/\s+/g, '');
    }
    return color.toLowerCase();
  }
}