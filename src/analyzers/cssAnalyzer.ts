/**
 * CSS/SCSS/SASS analyzer using postcss and css-tree
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as postcss from 'postcss';
import * as csstree from 'css-tree';
import { CSSAnalysisResult } from '../types';
import { AnalysisErrorHandler } from './errorHandler';

export class CSSAnalyzer {
  private errorHandler: AnalysisErrorHandler;

  constructor() {
    this.errorHandler = new AnalysisErrorHandler();
  }

  /**
   * Parse a CSS/SCSS file
   */
  async parseCSSFile(filePath: string): Promise<CSSAnalysisResult> {
    const result = await this.errorHandler.safeParseFile(filePath, async (file) => {
      const content = await fs.readFile(file, 'utf-8');
      return await this.analyzeCSS(file, content);
    });

    // Handle error results
    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      return {
        filePath,
        type: this.detectCSSType(filePath),
        selectors: [],
        colors: [],
        spacing: [],
        fontSize: [],
        fontWeight: [],
        zIndex: [],
        customProperties: {},
        success: false,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      };
    }

    return result as CSSAnalysisResult;
  }

  /**
   * Analyze CSS content
   */
  private async analyzeCSS(filePath: string, content: string): Promise<CSSAnalysisResult> {
    const type = this.detectCSSType(filePath);
    const result: CSSAnalysisResult = {
      filePath,
      type,
      selectors: [],
      colors: [],
      spacing: [],
      fontSize: [],
      fontWeight: [],
      zIndex: [],
      customProperties: {},
      success: true,
    };

    try {
      // Parse with PostCSS for better compatibility
      const ast = postcss.parse(content, { from: filePath });

      // Walk through all rules
      ast.walkRules((rule) => {
        // Collect selectors
        result.selectors.push(rule.selector);
      });

      // Walk through all declarations
      ast.walkDecls((decl) => {
        const { prop, value } = decl;

        // Extract colors
        if (this.isColorProperty(prop)) {
          const colors = this.extractColors(value);
          result.colors.push(...colors);
        }

        // Extract spacing
        if (this.isSpacingProperty(prop)) {
          const spacings = this.extractSpacing(value);
          result.spacing.push(...spacings);
        }

        // Extract font sizes
        if (prop === 'font-size') {
          result.fontSize.push(value);
        }

        // Extract font weights
        if (prop === 'font-weight') {
          result.fontWeight.push(value);
        }

        // Extract z-index
        if (prop === 'z-index') {
          result.zIndex.push(value);
        }

        // Extract custom properties (CSS variables)
        if (prop.startsWith('--')) {
          result.customProperties[prop] = value;
        }
      });

      // Use css-tree for more detailed analysis if needed
      try {
        const cssAst = csstree.parse(content, { parseValue: true, parseCustomProperty: true });
        
        // Additional analysis with css-tree
        csstree.walk(cssAst, (node) => {
          if (node.type === 'Function' && node.name === 'var') {
            // Track CSS variable usage
            const varName = this.extractVarName(node);
            if (varName && !result.customProperties[varName]) {
              result.customProperties[varName] = 'referenced';
            }
          }
        });
      } catch {
        // Fallback if css-tree parsing fails
      }

      // Remove duplicates
      result.selectors = [...new Set(result.selectors)];
      result.colors = [...new Set(result.colors)];
      result.spacing = [...new Set(result.spacing)];
      result.fontSize = [...new Set(result.fontSize)];
      result.fontWeight = [...new Set(result.fontWeight)];
      result.zIndex = [...new Set(result.zIndex)];

    } catch (error) {
      throw error;
    }

    return result;
  }

  /**
   * Detect CSS file type
   */
  private detectCSSType(filePath: string): 'css' | 'scss' | 'sass' | 'less' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.scss':
        return 'scss';
      case '.sass':
        return 'sass';
      case '.less':
        return 'less';
      default:
        return 'css';
    }
  }

  /**
   * Check if property is color-related
   */
  private isColorProperty(prop: string): boolean {
    const colorProps = [
      'color',
      'background-color',
      'border-color',
      'outline-color',
      'text-decoration-color',
      'background',
      'border',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'box-shadow',
      'text-shadow',
    ];
    return colorProps.includes(prop.toLowerCase());
  }

  /**
   * Check if property is spacing-related
   */
  private isSpacingProperty(prop: string): boolean {
    const spacingProps = [
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'gap',
      'row-gap',
      'column-gap',
    ];
    return spacingProps.includes(prop.toLowerCase());
  }

  /**
   * Extract color values from CSS value
   */
  private extractColors(value: string): string[] {
    const colors: string[] = [];

    // Hex colors
    const hexRegex = /#[0-9a-fA-F]{3,8}/g;
    const hexMatches = value.match(hexRegex);
    if (hexMatches) colors.push(...hexMatches);

    // RGB/RGBA colors
    const rgbRegex = /rgba?\([^)]+\)/g;
    const rgbMatches = value.match(rgbRegex);
    if (rgbMatches) colors.push(...rgbMatches);

    // HSL/HSLA colors
    const hslRegex = /hsla?\([^)]+\)/g;
    const hslMatches = value.match(hslRegex);
    if (hslMatches) colors.push(...hslMatches);

    // Named colors
    const namedColors = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
      'black', 'white', 'gray', 'grey', 'brown', 'cyan', 'magenta',
    ];
    const words = value.split(/\s+/);
    for (const word of words) {
      if (namedColors.includes(word.toLowerCase())) {
        colors.push(word);
      }
    }

    // CSS variables
    const varRegex = /var\(([^)]+)\)/g;
    const varMatches = value.match(varRegex);
    if (varMatches) colors.push(...varMatches);

    return colors;
  }

  /**
   * Extract spacing values from CSS value
   */
  private extractSpacing(value: string): string[] {
    const spacings: string[] = [];

    // Split by spaces and process each value
    const values = value.trim().split(/\s+/);
    for (const val of values) {
      // Skip keywords
      if (!/^(auto|inherit|initial|unset)$/i.test(val)) {
        spacings.push(val);
      }
    }

    return spacings;
  }

  /**
   * Extract variable name from css-tree node
   */
  private extractVarName(node: any): string | null {
    if (node.children && node.children.first) {
      const firstChild = node.children.first;
      if (firstChild.type === 'Identifier') {
        return `--${firstChild.name}`;
      }
    }
    return null;
  }

  /**
   * Batch process multiple CSS files
   */
  async analyzeCSSFiles(filePaths: string[]): Promise<CSSAnalysisResult[]> {
    const results: CSSAnalysisResult[] = [];

    for (const filePath of filePaths) {
      const cssAnalysis = await this.parseCSSFile(filePath);
      results.push(cssAnalysis);
    }

    return results;
  }

  /**
   * Extract design tokens from CSS results
   */
  extractDesignTokens(results: CSSAnalysisResult[]): {
    colors: string[];
    spacing: string[];
    typography: { sizes: string[]; weights: string[] };
    zIndex: string[];
    customProperties: Record<string, string>;
  } {
    const tokens = {
      colors: [] as string[],
      spacing: [] as string[],
      typography: {
        sizes: [] as string[],
        weights: [] as string[],
      },
      zIndex: [] as string[],
      customProperties: {} as Record<string, string>,
    };

    for (const result of results) {
      tokens.colors.push(...result.colors);
      tokens.spacing.push(...result.spacing);
      tokens.typography.sizes.push(...result.fontSize);
      tokens.typography.weights.push(...result.fontWeight);
      tokens.zIndex.push(...result.zIndex);
      Object.assign(tokens.customProperties, result.customProperties);
    }

    // Remove duplicates
    tokens.colors = [...new Set(tokens.colors)];
    tokens.spacing = [...new Set(tokens.spacing)];
    tokens.typography.sizes = [...new Set(tokens.typography.sizes)];
    tokens.typography.weights = [...new Set(tokens.typography.weights)];
    tokens.zIndex = [...new Set(tokens.zIndex)];

    return tokens;
  }
}