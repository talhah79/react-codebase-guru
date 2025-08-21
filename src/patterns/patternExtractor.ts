/**
 * Pattern extraction and learning from project analysis
 */

import { 
  ComponentInfo, 
  CSSAnalysisResult, 
  ProjectAnalysis 
} from '../types';

export interface SpacingGrid {
  unit: number;
  values: number[];
  confidence: number;
}

export interface ColorScheme {
  primary: string[];
  secondary: string[];
  neutrals: string[];
  semantic: {
    error?: string[];
    warning?: string[];
    success?: string[];
    info?: string[];
  };
}

export interface TypographyScale {
  fontSizes: string[];
  fontWeights: string[];
  fontFamilies: string[];
  lineHeights?: string[];
  letterSpacings?: string[];
}

export interface ComponentPattern {
  name: string;
  usage: number;
  props: string[];
  variants?: string[];
  locations: string[];
}

export interface DesignPatterns {
  spacing: SpacingGrid;
  colors: ColorScheme;
  typography: TypographyScale;
  components: ComponentPattern[];
  cssFramework?: string;
  namingConvention?: string;
}

export class PatternExtractor {
  private advancedExtractor?: import('./advancedPatternExtractor').AdvancedPatternExtractor;

  constructor() {
    // Lazy load advanced extractor to avoid circular dependencies
  }

  /**
   * Extract all design patterns from project analysis
   */
  extractPatterns(analysis: ProjectAnalysis): DesignPatterns {
    const spacing = this.detectSpacingGrid(analysis.styles);
    const colors = this.extractColorScheme(analysis.styles, analysis.components);
    const typography = this.extractTypographyScale(analysis.styles);
    const components = this.extractComponentPatterns(analysis.components);
    const cssFramework = this.detectCSSFramework(analysis);
    const namingConvention = this.detectNamingConvention(analysis.components);

    return {
      spacing,
      colors,
      typography,
      components,
      cssFramework,
      namingConvention,
    };
  }

  /**
   * Extract patterns with advanced analysis
   */
  async extractAdvancedPatterns(analysis: ProjectAnalysis): Promise<{
    patterns: DesignPatterns;
    confidences?: import('./advancedPatternExtractor').PatternConfidence[];
    anomalies?: import('./advancedPatternExtractor').PatternAnomaly[];
    similarities?: import('./advancedPatternExtractor').ComponentSimilarity[];
  }> {
    // Load advanced extractor if not already loaded
    if (!this.advancedExtractor) {
      const { AdvancedPatternExtractor } = await import('./advancedPatternExtractor');
      this.advancedExtractor = new AdvancedPatternExtractor();
    }

    const result = this.advancedExtractor.extractAdvancedPatterns(
      analysis.components,
      analysis.styles
    );

    return result;
  }

  /**
   * Detect spacing grid system (4px, 8px, etc.)
   */
  detectSpacingGrid(styles: CSSAnalysisResult[]): SpacingGrid {
    const allSpacing: number[] = [];

    // Collect all spacing values
    for (const style of styles) {
      for (const spacing of style.spacing) {
        // Convert to pixels
        const value = this.parseSpacingValue(spacing);
        if (value !== null && value > 0) {
          allSpacing.push(value);
        }
      }
    }

    if (allSpacing.length === 0) {
      return { unit: 8, values: [], confidence: 0 };
    }

    // Find the greatest common divisor
    const gcd = this.findGCD(allSpacing);
    
    // Common grid units are 4, 8, 16
    const commonUnits = [4, 8, 16];
    let bestUnit = gcd;
    
    // Prefer common units if they're close to GCD
    for (const unit of commonUnits) {
      if (gcd % unit === 0 || unit % gcd === 0) {
        bestUnit = unit;
        break;
      }
    }

    // Calculate confidence based on how well values fit the grid
    const fittingValues = allSpacing.filter(v => v % bestUnit === 0);
    const confidence = Math.round((fittingValues.length / allSpacing.length) * 100);

    // Get unique values that fit the grid
    const uniqueValues = [...new Set(fittingValues)].sort((a, b) => a - b);

    return {
      unit: bestUnit,
      values: uniqueValues,
      confidence,
    };
  }

  /**
   * Extract color scheme from styles and components
   */
  extractColorScheme(
    styles: CSSAnalysisResult[], 
    components: ComponentInfo[]
  ): ColorScheme {
    const colorMap = new Map<string, number>();

    // Collect colors from CSS
    for (const style of styles) {
      for (const color of style.colors) {
        const normalized = this.normalizeColor(color);
        if (normalized) {
          colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1);
        }
      }
    }

    // Collect colors from component styles
    for (const component of components) {
      if (component.styling?.colors) {
        for (const color of component.styling.colors) {
          const normalized = this.normalizeColor(color);
          if (normalized) {
            colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1);
          }
        }
      }
    }

    // Sort colors by frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);

    // Categorize colors
    const scheme: ColorScheme = {
      primary: [],
      secondary: [],
      neutrals: [],
      semantic: {},
    };

    for (const color of sortedColors) {
      if (this.isNeutralColor(color)) {
        scheme.neutrals.push(color);
      } else if (this.isSemanticColor(color, 'error')) {
        scheme.semantic.error = scheme.semantic.error || [];
        scheme.semantic.error.push(color);
      } else if (this.isSemanticColor(color, 'warning')) {
        scheme.semantic.warning = scheme.semantic.warning || [];
        scheme.semantic.warning.push(color);
      } else if (this.isSemanticColor(color, 'success')) {
        scheme.semantic.success = scheme.semantic.success || [];
        scheme.semantic.success.push(color);
      } else if (scheme.primary.length < 3) {
        scheme.primary.push(color);
      } else if (scheme.secondary.length < 3) {
        scheme.secondary.push(color);
      }
    }

    return scheme;
  }

  /**
   * Extract typography scale
   */
  extractTypographyScale(styles: CSSAnalysisResult[]): TypographyScale {
    const fontSizes = new Set<string>();
    const fontWeights = new Set<string>();
    const fontFamilies = new Set<string>();

    for (const style of styles) {
      style.fontSize.forEach(size => fontSizes.add(size));
      style.fontWeight.forEach(weight => fontWeights.add(weight));
      
      // Extract font families from custom properties
      Object.entries(style.customProperties).forEach(([key, value]) => {
        if (key.includes('font') && !key.includes('size') && !key.includes('weight')) {
          fontFamilies.add(value);
        }
      });
    }

    // Sort font sizes numerically
    const sortedSizes = Array.from(fontSizes).sort((a, b) => {
      const aVal = this.parseFontSize(a);
      const bVal = this.parseFontSize(b);
      return aVal - bVal;
    });

    // Sort font weights numerically
    const sortedWeights = Array.from(fontWeights).sort((a, b) => {
      const aVal = parseInt(a) || 400;
      const bVal = parseInt(b) || 400;
      return aVal - bVal;
    });

    return {
      fontSizes: sortedSizes,
      fontWeights: sortedWeights,
      fontFamilies: Array.from(fontFamilies),
    };
  }

  /**
   * Extract component usage patterns
   */
  extractComponentPatterns(components: ComponentInfo[]): ComponentPattern[] {
    const patternMap = new Map<string, ComponentPattern>();

    for (const component of components) {
      if (!component.success) continue;

      const key = component.name;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          name: component.name,
          usage: 0,
          props: [],
          locations: [],
        });
      }

      const pattern = patternMap.get(key)!;
      pattern.usage++;
      pattern.locations.push(component.filePath);

      // Collect unique props
      if (component.props) {
        const propNames = component.props.map(p => p.name);
        pattern.props = [...new Set([...pattern.props, ...propNames])];
      }
    }

    // Sort by usage frequency
    return Array.from(patternMap.values())
      .sort((a, b) => b.usage - a.usage);
  }

  /**
   * Detect CSS framework being used
   */
  detectCSSFramework(analysis: ProjectAnalysis): string | undefined {
    // Check for Tailwind classes
    const tailwindClasses = ['bg-', 'text-', 'p-', 'm-', 'flex', 'grid', 'w-', 'h-'];
    let tailwindCount = 0;

    for (const component of analysis.components) {
      if (component.styling?.classes) {
        for (const cls of component.styling.classes) {
          if (tailwindClasses.some(prefix => cls.startsWith(prefix))) {
            tailwindCount++;
          }
        }
      }
    }

    if (tailwindCount > 10) return 'tailwind';

    // Check for Bootstrap classes
    const bootstrapClasses = ['btn', 'col-', 'row', 'container', 'navbar', 'modal'];
    let bootstrapCount = 0;

    for (const template of analysis.templates) {
      for (const cls of template.classes) {
        if (bootstrapClasses.some(prefix => cls.includes(prefix))) {
          bootstrapCount++;
        }
      }
    }

    if (bootstrapCount > 5) return 'bootstrap';

    // Check for styled-components or emotion
    for (const component of analysis.components) {
      if (component.styling?.type === 'styled-components') return 'styled-components';
      if (component.styling?.type === 'emotion') return 'emotion';
    }

    // Check framework from package.json detection
    return analysis.framework.cssFramework;
  }

  /**
   * Detect component naming convention
   */
  detectNamingConvention(components: ComponentInfo[]): string {
    let pascalCase = 0;
    let camelCase = 0;
    let kebabCase = 0;

    for (const component of components) {
      const name = component.name;
      
      if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        pascalCase++;
      } else if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
        camelCase++;
      } else if (/^[a-z]+(-[a-z]+)*$/.test(name)) {
        kebabCase++;
      }
    }

    if (pascalCase >= camelCase && pascalCase >= kebabCase) return 'PascalCase';
    if (camelCase >= kebabCase) return 'camelCase';
    return 'kebab-case';
  }

  /**
   * Parse spacing value to pixels
   */
  private parseSpacingValue(value: string): number | null {
    // Remove 'px' and parse
    if (value.endsWith('px')) {
      return parseInt(value);
    }

    // Convert rem to pixels (assuming 16px base)
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16;
    }

    // Convert em to pixels (assuming 16px base)
    if (value.endsWith('em')) {
      return parseFloat(value) * 16;
    }

    // Try to parse as number
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Find greatest common divisor of array of numbers
   */
  private findGCD(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };

    return numbers.reduce((acc, num) => gcd(acc, num));
  }

  /**
   * Normalize color values
   */
  private normalizeColor(color: string): string | null {
    // Skip CSS variables
    if (color.startsWith('var(')) return null;
    
    // Normalize hex colors to lowercase
    if (color.startsWith('#')) {
      return color.toLowerCase();
    }

    // Keep rgb/rgba/hsl/hsla as is
    if (color.match(/^(rgb|rgba|hsl|hsla)\(/)) {
      return color;
    }

    // Named colors
    const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 
                         'black', 'white', 'gray', 'grey'];
    if (namedColors.includes(color.toLowerCase())) {
      return color.toLowerCase();
    }

    return null;
  }

  /**
   * Check if color is neutral (gray, black, white)
   */
  private isNeutralColor(color: string): boolean {
    if (color === 'white' || color === 'black' || 
        color.includes('gray') || color.includes('grey')) {
      return true;
    }

    // Check hex colors for grayscale
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return r === g && g === b;
    }

    return false;
  }

  /**
   * Check if color is semantic (error, warning, success)
   */
  private isSemanticColor(color: string, type: string): boolean {
    const patterns = {
      error: ['red', '#ff0000', '#f00', '#dc3545', '#e53e3e'],
      warning: ['yellow', 'orange', '#ffc107', '#ffaa00', '#f6ad55'],
      success: ['green', '#00ff00', '#0f0', '#28a745', '#48bb78'],
      info: ['blue', '#0000ff', '#00f', '#17a2b8', '#4299e1'],
    };

    const typePatterns = patterns[type as keyof typeof patterns] || [];
    return typePatterns.some(pattern => 
      color.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Parse font size to pixels
   */
  private parseFontSize(size: string): number {
    if (size.endsWith('px')) {
      return parseInt(size);
    }
    if (size.endsWith('rem')) {
      return parseFloat(size) * 16;
    }
    if (size.endsWith('em')) {
      return parseFloat(size) * 16;
    }
    return parseInt(size) || 16;
  }

  /**
   * Calculate pattern similarity score
   */
  calculateSimilarity(pattern1: any, pattern2: any): number {
    // Simple similarity calculation - can be enhanced
    const p1Str = JSON.stringify(pattern1);
    const p2Str = JSON.stringify(pattern2);
    
    if (p1Str === p2Str) return 100;
    
    // Calculate based on common properties
    let commonProps = 0;
    let totalProps = 0;

    const countProps = (obj: any): number => {
      let count = 0;
      for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined) {
          count++;
        }
      }
      return count;
    };

    totalProps = countProps(pattern1) + countProps(pattern2);
    
    for (const key in pattern1) {
      if (key in pattern2 && pattern1[key] === pattern2[key]) {
        commonProps += 2;
      }
    }

    return totalProps > 0 ? Math.round((commonProps / totalProps) * 100) : 0;
  }
}