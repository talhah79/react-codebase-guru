/**
 * React component analyzer using react-docgen and react-docgen-typescript
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentInfo, PropInfo, StyleInfo } from '../types';
import { AnalysisErrorHandler } from './errorHandler';

// Dynamic imports for ESM modules
let reactDocgen: any;
let reactDocgenTypescript: any;

async function loadParsers() {
  if (!reactDocgen) {
    reactDocgen = await import('react-docgen');
  }
  if (!reactDocgenTypescript) {
    reactDocgenTypescript = await import('react-docgen-typescript');
  }
}

export class ComponentAnalyzer {
  private errorHandler: AnalysisErrorHandler;
  private tsParser: any;

  constructor() {
    this.errorHandler = new AnalysisErrorHandler();
  }

  /**
   * Initialize the TypeScript parser
   */
  private async initializeTsParser() {
    if (!this.tsParser) {
      await loadParsers();
      const options = {
        shouldExtractLiteralValuesFromEnum: true,
        shouldRemoveUndefinedFromOptional: true,
        propFilter: (prop: any) => {
          if (prop.parent) {
            return !prop.parent.fileName.includes('node_modules');
          }
          return true;
        },
      };
      this.tsParser = reactDocgenTypescript.withDefaultConfig(options);
    }
  }

  /**
   * Parse a React component file
   */
  async parseReactComponent(filePath: string): Promise<ComponentInfo> {
    const result = await this.errorHandler.safeParseFile(filePath, async (file) => {
      const ext = path.extname(file).toLowerCase();
      const isTypeScript = ext === '.ts' || ext === '.tsx';

      if (isTypeScript) {
        return await this.parseTypeScriptComponent(file);
      } else {
        return await this.parseJavaScriptComponent(file);
      }
    });

    // Handle error results
    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      return {
        name: path.basename(filePath, path.extname(filePath)),
        filePath,
        type: 'unknown',
        hasJSX: false,
        success: false,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      };
    }

    return result as ComponentInfo;
  }

  /**
   * Parse TypeScript React component
   */
  private async parseTypeScriptComponent(filePath: string): Promise<ComponentInfo> {
    try {
      await this.initializeTsParser();
      const componentDocs = this.tsParser.parse(filePath);

      if (componentDocs.length === 0) {
        // No component found, check if it's a utility file
        return await this.analyzeNonComponentFile(filePath);
      }

      const doc = componentDocs[0]; // Take the first component found
      
      const props: PropInfo[] = Object.entries(doc.props || {}).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type?.name || 'unknown',
        required: prop.required || false,
        defaultValue: prop.defaultValue?.value,
        description: prop.description,
      }));

      const styling = await this.detectStyling(filePath);

      return {
        name: doc.displayName || doc.name || path.basename(filePath, path.extname(filePath)),
        filePath,
        props,
        type: this.detectComponentType(await fs.readFile(filePath, 'utf-8')),
        hasJSX: true,
        styling,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse JavaScript React component
   */
  private async parseJavaScriptComponent(filePath: string): Promise<ComponentInfo> {
    try {
      await loadParsers();
      const source = await fs.readFile(filePath, 'utf-8');
      
      let componentInfo;
      try {
        componentInfo = reactDocgen.parse(source, {
          filename: filePath,
          handlers: reactDocgen.defaultHandlers,
        });
      } catch {
        // If parsing fails, it might not be a component
        return await this.analyzeNonComponentFile(filePath);
      }

      const props: PropInfo[] = Object.entries(componentInfo.props || {}).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type?.name || 'unknown',
        required: prop.required || false,
        defaultValue: prop.defaultValue?.value,
        description: prop.description,
      }));

      const styling = await this.detectStyling(filePath);

      return {
        name: componentInfo.displayName || path.basename(filePath, path.extname(filePath)),
        filePath,
        props,
        type: this.detectComponentType(source),
        hasJSX: true,
        styling,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analyze non-component JavaScript/TypeScript files
   */
  private async analyzeNonComponentFile(filePath: string): Promise<ComponentInfo> {
    const source = await fs.readFile(filePath, 'utf-8');
    const hasJSX = this.detectJSX(source);
    const type = this.detectComponentType(source);
    const styling = await this.detectStyling(filePath);

    return {
      name: path.basename(filePath, path.extname(filePath)),
      filePath,
      type,
      hasJSX,
      styling,
      success: true,
    };
  }

  /**
   * Detect component type (functional, class, or unknown)
   */
  private detectComponentType(source: string): 'functional' | 'class' | 'unknown' {
    // Check for class component
    if (/class\s+\w+\s+extends\s+(React\.)?Component/.test(source) ||
        /class\s+\w+\s+extends\s+(React\.)?PureComponent/.test(source)) {
      return 'class';
    }

    // Check for functional component patterns
    if (/const\s+\w+\s*[:=]\s*\([^)]*\)\s*=>\s*[\(\{<]/.test(source) ||
        /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*return\s*[\(\<]/.test(source) ||
        /export\s+default\s+function\s*\([^)]*\)\s*\{/.test(source)) {
      return 'functional';
    }

    return 'unknown';
  }

  /**
   * Detect if file contains JSX
   */
  private detectJSX(source: string): boolean {
    return /<[A-Z]\w*[\s/>]/.test(source) || /<[a-z]+\s+[^>]*\/>/.test(source);
  }

  /**
   * Detect styling approach used in component
   */
  private async detectStyling(filePath: string): Promise<StyleInfo | undefined> {
    try {
      const source = await fs.readFile(filePath, 'utf-8');
      const styleInfo: StyleInfo = {
        type: 'inline',
        classes: [],
        tokens: [],
        spacing: [],
        colors: [],
      };

      // Detect Tailwind classes
      const tailwindRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/g;
      let match;
      while ((match = tailwindRegex.exec(source)) !== null) {
        const classes = match[1].split(/\s+/);
        styleInfo.classes?.push(...classes);
        
        // Check if these are Tailwind classes
        if (classes.some(c => /^(bg|text|p|m|w|h|flex|grid)-/.test(c))) {
          styleInfo.type = 'tailwind';
        }
      }

      // Detect styled-components
      if (/import\s+styled\s+from\s+['"]styled-components['"]/.test(source) ||
          /const\s+\w+\s*=\s*styled\./.test(source)) {
        styleInfo.type = 'styled-components';
      }

      // Detect emotion
      if (/import\s+{\s*css\s*}\s+from\s+['"]@emotion\//.test(source) ||
          /import\s+styled\s+from\s+['"]@emotion\/styled['"]/.test(source)) {
        styleInfo.type = 'emotion';
      }

      // Detect inline styles
      const inlineStyleRegex = /style\s*=\s*\{\{([^}]+)\}\}/g;
      while ((match = inlineStyleRegex.exec(source)) !== null) {
        // Extract style properties
        const styleContent = match[1];
        const colorMatch = /color:\s*['"]?([^'",}]+)['"]?/g.exec(styleContent);
        if (colorMatch) {
          styleInfo.colors?.push(colorMatch[1]);
        }
      }

      return styleInfo;
    } catch {
      return undefined;
    }
  }

  /**
   * Batch process multiple component files
   */
  async analyzeComponents(filePaths: string[]): Promise<ComponentInfo[]> {
    const results: ComponentInfo[] = [];
    
    for (const filePath of filePaths) {
      const componentInfo = await this.parseReactComponent(filePath);
      results.push(componentInfo);
    }

    return results;
  }
}