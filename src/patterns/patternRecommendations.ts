/**
 * Deterministic pattern recommendation engine
 */

import { DesignPatterns } from './patternExtractor';
import { PatternConfidence, PatternAnomaly, ComponentSimilarity } from './advancedPatternExtractor';

export interface PatternRecommendation {
  id: string;
  type: 'consolidate' | 'standardize' | 'simplify' | 'enhance' | 'create';
  priority: 'high' | 'medium' | 'low';
  category: 'spacing' | 'colors' | 'typography' | 'components' | 'architecture';
  title: string;
  description: string;
  rationale: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  examples: string[];
  before?: string;
  after?: string;
  affectedFiles: string[];
}

export interface RecommendationContext {
  projectSize: 'small' | 'medium' | 'large';
  teamSize: 'solo' | 'small' | 'large';
  complexityLevel: number;
  maintainability: number;
  consistencyScore: number;
}

export class PatternRecommendationEngine {
  private recommendationRules: RecommendationRule[];

  constructor() {
    this.recommendationRules = this.initializeRules();
  }

  /**
   * Generate comprehensive pattern recommendations
   */
  generateRecommendations(
    patterns: DesignPatterns,
    confidences: PatternConfidence[],
    anomalies: PatternAnomaly[],
    similarities: ComponentSimilarity[],
    context: RecommendationContext
  ): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Apply all recommendation rules
    this.recommendationRules.forEach(rule => {
      const ruleRecommendations = rule.apply(patterns, confidences, anomalies, similarities, context);
      recommendations.push(...ruleRecommendations);
    });

    // Sort by priority and impact
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Get actionable quick wins
   */
  getQuickWins(recommendations: PatternRecommendation[]): PatternRecommendation[] {
    return recommendations.filter(r => 
      r.effort === 'low' && 
      (r.priority === 'high' || r.priority === 'medium')
    ).slice(0, 5);
  }

  /**
   * Get high-impact recommendations
   */
  getHighImpactRecommendations(recommendations: PatternRecommendation[]): PatternRecommendation[] {
    return recommendations.filter(r => 
      r.priority === 'high' && 
      r.impact.includes('significant')
    );
  }

  /**
   * Generate pattern merger suggestions
   */
  generateMergerSuggestions(similarities: ComponentSimilarity[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    const mergeCandidates = similarities.filter(s => s.recommendation === 'merge');
    const consolidateCandidates = similarities.filter(s => s.recommendation === 'consolidate');

    if (mergeCandidates.length > 0) {
      recommendations.push({
        id: 'merge-similar-components',
        type: 'consolidate',
        priority: 'medium',
        category: 'components',
        title: `Merge ${mergeCandidates.length} pairs of similar components`,
        description: 'Components with high similarity can be merged to reduce duplication',
        rationale: 'Highly similar components (>80% similarity) indicate potential over-engineering',
        impact: 'Reduces codebase size and maintenance overhead',
        effort: 'medium',
        examples: mergeCandidates.slice(0, 3).map(c => `${c.component1} + ${c.component2}`),
        affectedFiles: this.getAffectedFiles(mergeCandidates),
      });
    }

    if (consolidateCandidates.length > 0) {
      recommendations.push({
        id: 'consolidate-component-patterns',
        type: 'consolidate',
        priority: 'low',
        category: 'components',
        title: `Consolidate patterns in ${consolidateCandidates.length} component pairs`,
        description: 'Extract common patterns from similar components',
        rationale: 'Components share common patterns that could be abstracted',
        impact: 'Improves consistency and reusability',
        effort: 'medium',
        examples: consolidateCandidates.slice(0, 3).map(c => `Extract common pattern from ${c.component1} and ${c.component2}`),
        affectedFiles: this.getAffectedFiles(consolidateCandidates),
      });
    }

    return recommendations;
  }

  /**
   * Validate recommendations against project constraints
   */
  validateRecommendations(
    recommendations: PatternRecommendation[],
    context: RecommendationContext
  ): PatternRecommendation[] {
    return recommendations.filter(rec => {
      // Skip high-effort recommendations for small teams
      if (context.teamSize === 'solo' && rec.effort === 'high') {
        return false;
      }

      // Skip complex recommendations for small projects
      if (context.projectSize === 'small' && rec.category === 'architecture') {
        return false;
      }

      // Focus on high-impact items for large projects
      if (context.projectSize === 'large' && rec.priority === 'low') {
        return false;
      }

      return true;
    });
  }

  // Private helper methods

  private initializeRules(): RecommendationRule[] {
    return [
      new SpacingConsistencyRule(),
      new ColorPaletteRule(),
      new TypographyScaleRule(),
      new ComponentComplexityRule(),
      new NamingConsistencyRule(),
      new ArchitecturalRule(),
    ];
  }

  private prioritizeRecommendations(recommendations: PatternRecommendation[]): PatternRecommendation[] {
    return recommendations.sort((a, b) => {
      // First by priority
      const priorityScore = this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
      if (priorityScore !== 0) return priorityScore;

      // Then by effort (lower effort first)
      const effortScore = this.getEffortScore(a.effort) - this.getEffortScore(b.effort);
      if (effortScore !== 0) return effortScore;

      // Finally by category importance
      return this.getCategoryScore(b.category) - this.getCategoryScore(a.category);
    });
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private getEffortScore(effort: string): number {
    switch (effort) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  private getCategoryScore(category: string): number {
    switch (category) {
      case 'architecture': return 5;
      case 'components': return 4;
      case 'spacing': return 3;
      case 'colors': return 2;
      case 'typography': return 1;
      default: return 0;
    }
  }

  private getAffectedFiles(similarities: ComponentSimilarity[]): string[] {
    const files = new Set<string>();
    similarities.forEach(sim => {
      // In a real implementation, you'd track file paths from components
      files.add(`${sim.component1}.tsx`);
      files.add(`${sim.component2}.tsx`);
    });
    return Array.from(files);
  }
}

// Recommendation rule interfaces and implementations

interface RecommendationRule {
  apply(
    patterns: DesignPatterns,
    confidences: PatternConfidence[],
    anomalies: PatternAnomaly[],
    similarities: ComponentSimilarity[],
    context: RecommendationContext
  ): PatternRecommendation[];
}

class SpacingConsistencyRule implements RecommendationRule {
  apply(patterns: DesignPatterns, confidences: PatternConfidence[], anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], _context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    const spacingConfidence = confidences.find(c => c.type === 'spacing');
    const spacingAnomalies = anomalies.filter(a => a.type === 'spacing');

    if (spacingConfidence && spacingConfidence.score < 0.6) {
      recommendations.push({
        id: 'improve-spacing-consistency',
        type: 'standardize',
        priority: 'high',
        category: 'spacing',
        title: 'Improve spacing consistency',
        description: `Spacing patterns have ${(spacingConfidence.score * 100).toFixed(1)}% consistency`,
        rationale: 'Low spacing consistency creates visual inconsistency and harder maintenance',
        impact: 'Significant improvement in visual consistency and design system adherence',
        effort: 'medium',
        examples: [
          `Use ${patterns.spacing.unit}px grid system consistently`,
          'Replace arbitrary spacing values with grid multiples',
          'Document spacing tokens for team usage',
        ],
        before: 'margin: 13px; padding: 27px;',
        after: `margin: ${patterns.spacing.unit}px; padding: ${patterns.spacing.unit * 3}px;`,
        affectedFiles: spacingAnomalies.map(a => a.filePath),
      });
    }

    if (spacingAnomalies.length > 10) {
      recommendations.push({
        id: 'fix-spacing-anomalies',
        type: 'standardize',
        priority: 'medium',
        category: 'spacing',
        title: `Fix ${spacingAnomalies.length} spacing anomalies`,
        description: 'Multiple spacing values deviate from the established grid',
        rationale: 'Anomalies break visual consistency and make maintenance harder',
        impact: 'Improved visual consistency and reduced cognitive load',
        effort: 'low',
        examples: spacingAnomalies.slice(0, 3).map(a => `${a.current} → ${a.expected}`),
        affectedFiles: spacingAnomalies.map(a => a.filePath),
      });
    }

    return recommendations;
  }
}

class ColorPaletteRule implements RecommendationRule {
  apply(patterns: DesignPatterns, _confidences: PatternConfidence[], anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], _context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    const totalColors = patterns.colors.primary.length + patterns.colors.secondary.length;
    const colorAnomalies = anomalies.filter(a => a.type === 'color');

    if (totalColors > 12) {
      recommendations.push({
        id: 'simplify-color-palette',
        type: 'simplify',
        priority: 'medium',
        category: 'colors',
        title: 'Simplify color palette',
        description: `Color palette has ${totalColors} colors, consider reducing to 8-10`,
        rationale: 'Large color palettes are harder to maintain and can create inconsistency',
        impact: 'Easier maintenance and more consistent color usage',
        effort: 'medium',
        examples: [
          'Consolidate similar primary colors',
          'Limit secondary colors to 3-4 variants',
          'Use systematic color generation',
        ],
        affectedFiles: [],
      });
    }

    if (colorAnomalies.length > 5) {
      recommendations.push({
        id: 'standardize-color-usage',
        type: 'standardize',
        priority: 'medium',
        category: 'colors',
        title: `Standardize ${colorAnomalies.length} color anomalies`,
        description: 'Multiple colors deviate from the established palette',
        rationale: 'Color anomalies break brand consistency and confuse users',
        impact: 'Better brand consistency and user experience',
        effort: 'low',
        examples: colorAnomalies.slice(0, 3).map(a => `${a.current} → ${a.expected}`),
        affectedFiles: colorAnomalies.map(a => a.filePath),
      });
    }

    // Check for missing semantic colors
    if (!patterns.colors.semantic.error) {
      recommendations.push({
        id: 'add-semantic-colors',
        type: 'create',
        priority: 'low',
        category: 'colors',
        title: 'Add semantic color system',
        description: 'Define semantic colors for error, warning, success, and info states',
        rationale: 'Semantic colors improve UX and accessibility',
        impact: 'Better user feedback and accessibility compliance',
        effort: 'low',
        examples: [
          'error: #dc3545',
          'warning: #ffc107',
          'success: #28a745',
          'info: #17a2b8',
        ],
        affectedFiles: [],
      });
    }

    return recommendations;
  }
}

class TypographyScaleRule implements RecommendationRule {
  apply(patterns: DesignPatterns, _confidences: PatternConfidence[], anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], _context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    const typographyAnomalies = anomalies.filter(a => a.type === 'typography');

    if (patterns.typography.fontSizes.length > 8) {
      recommendations.push({
        id: 'simplify-typography-scale',
        type: 'simplify',
        priority: 'low',
        category: 'typography',
        title: 'Simplify typography scale',
        description: `Typography scale has ${patterns.typography.fontSizes.length} sizes, consider using 6-8`,
        rationale: 'Too many font sizes create visual hierarchy confusion',
        impact: 'Clearer visual hierarchy and easier maintenance',
        effort: 'medium',
        examples: [
          'Use systematic scale (1.2x ratio)',
          'Consolidate similar sizes',
          'Remove rarely used sizes',
        ],
        affectedFiles: [],
      });
    }

    if (typographyAnomalies.length > 3) {
      recommendations.push({
        id: 'fix-typography-anomalies',
        type: 'standardize',
        priority: 'low',
        category: 'typography',
        title: `Fix ${typographyAnomalies.length} typography anomalies`,
        description: 'Font sizes deviate from the established scale',
        rationale: 'Typography anomalies break visual hierarchy',
        impact: 'Improved readability and visual consistency',
        effort: 'low',
        examples: typographyAnomalies.slice(0, 3).map(a => `${a.current} → ${a.expected}`),
        affectedFiles: typographyAnomalies.map(a => a.filePath),
      });
    }

    return recommendations;
  }
}

class ComponentComplexityRule implements RecommendationRule {
  apply(_patterns: DesignPatterns, _confidences: PatternConfidence[], anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], _context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    const componentAnomalies = anomalies.filter(a => a.type === 'component' && a.severity === 'high');

    if (componentAnomalies.length > 0) {
      recommendations.push({
        id: 'reduce-component-complexity',
        type: 'simplify',
        priority: 'high',
        category: 'components',
        title: `Reduce complexity in ${componentAnomalies.length} components`,
        description: 'Components have high complexity that makes them hard to maintain',
        rationale: 'Complex components are harder to test, debug, and reuse',
        impact: 'Improved maintainability and testability',
        effort: 'high',
        examples: [
          'Break down large components into smaller ones',
          'Use composition over complex prop interfaces',
          'Extract custom hooks for complex logic',
        ],
        affectedFiles: componentAnomalies.map(a => a.filePath),
      });
    }

    return recommendations;
  }
}

class NamingConsistencyRule implements RecommendationRule {
  apply(patterns: DesignPatterns, _confidences: PatternConfidence[], _anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], _context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    if (patterns.namingConvention !== 'PascalCase') {
      recommendations.push({
        id: 'standardize-naming-convention',
        type: 'standardize',
        priority: 'low',
        category: 'components',
        title: 'Standardize component naming',
        description: 'Inconsistent component naming convention detected',
        rationale: 'Consistent naming improves code readability and team collaboration',
        impact: 'Better code organization and team productivity',
        effort: 'low',
        examples: [
          'Use PascalCase for component names',
          'Use camelCase for prop names',
          'Use kebab-case for CSS class names',
        ],
        affectedFiles: [],
      });
    }

    return recommendations;
  }
}

class ArchitecturalRule implements RecommendationRule {
  apply(_patterns: DesignPatterns, _confidences: PatternConfidence[], _anomalies: PatternAnomaly[], _similarities: ComponentSimilarity[], context: RecommendationContext): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    // Only suggest architectural changes for larger projects
    if (context.projectSize === 'large' && context.consistencyScore < 0.6) {
      recommendations.push({
        id: 'implement-design-system',
        type: 'create',
        priority: 'high',
        category: 'architecture',
        title: 'Implement comprehensive design system',
        description: 'Low consistency score indicates need for design system',
        rationale: 'Large projects benefit significantly from systematic design approaches',
        impact: 'Massive improvement in consistency and development velocity',
        effort: 'high',
        examples: [
          'Create design token system',
          'Build component library',
          'Establish design guidelines',
          'Implement automated checking',
        ],
        affectedFiles: [],
      });
    }

    return recommendations;
  }
}