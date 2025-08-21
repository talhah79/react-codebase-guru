/**
 * HTML template analyzer using node-html-parser
 */

import * as fs from 'fs-extra';
import { parse as parseHTML, HTMLElement } from 'node-html-parser';
import {
  HTMLAnalysisResult,
  ElementInfo,
  InlineStyleInfo,
  AccessibilityInfo,
} from '../types';
import { AnalysisErrorHandler } from './errorHandler';

export class HTMLAnalyzer {
  private errorHandler: AnalysisErrorHandler;

  constructor() {
    this.errorHandler = new AnalysisErrorHandler();
  }

  /**
   * Parse an HTML file
   */
  async parseHTMLFile(filePath: string): Promise<HTMLAnalysisResult> {
    const result = await this.errorHandler.safeParseFile(filePath, async (file) => {
      const content = await fs.readFile(file, 'utf-8');
      return await this.analyzeHTML(file, content);
    });

    // Handle error results
    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      return {
        filePath,
        elements: [],
        inlineStyles: [],
        classes: [],
        ids: [],
        dataAttributes: [],
        accessibility: {
          hasAriaLabels: false,
          hasAltTexts: false,
          missingLabels: [],
          missingAlts: [],
        },
        success: false,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      };
    }

    return result as HTMLAnalysisResult;
  }

  /**
   * Analyze HTML content
   */
  private async analyzeHTML(filePath: string, content: string): Promise<HTMLAnalysisResult> {
    const result: HTMLAnalysisResult = {
      filePath,
      elements: [],
      inlineStyles: [],
      classes: [],
      ids: [],
      dataAttributes: [],
      accessibility: {
        hasAriaLabels: false,
        hasAltTexts: false,
        missingLabels: [],
        missingAlts: [],
      },
      success: true,
    };

    try {
      const root = parseHTML(content, {
        lowerCaseTagName: false,
        comment: false,
        blockTextElements: {
          script: true,
          noscript: true,
          style: true,
          pre: true,
        },
      });

      // Analyze all elements in the tree
      const allElements = root.querySelectorAll('*');
      for (const element of allElements) {
        this.analyzeElement(element as HTMLElement, result);
      }

      // Remove duplicates
      result.classes = [...new Set(result.classes)];
      result.ids = [...new Set(result.ids)];
      result.dataAttributes = [...new Set(result.dataAttributes)];

      // Check accessibility status
      result.accessibility.hasAriaLabels = this.hasAriaLabels(root as HTMLElement);
      result.accessibility.hasAltTexts = this.hasAltTexts(root as HTMLElement);

    } catch (error) {
      throw error;
    }

    return result;
  }

  /**
   * Recursively analyze HTML elements
   */
  private analyzeElement(element: HTMLElement, result: HTMLAnalysisResult): void {
    // Skip text nodes
    if (!element.tagName) {
      return;
    }

    // Create element info
    const elementInfo: ElementInfo = {
      tagName: element.tagName.toLowerCase(),
      attributes: {},
    };

    // Process attributes
    const attributes = element.attributes || {};
    for (const [attrName, attrValue] of Object.entries(attributes)) {
      elementInfo.attributes[attrName] = attrValue;

      // Collect classes
      if (attrName === 'class' && attrValue) {
        const classes = attrValue.split(/\s+/).filter(Boolean);
        result.classes.push(...classes);
      }

      // Collect IDs
      if (attrName === 'id' && attrValue) {
        result.ids.push(attrValue);
      }

      // Collect data attributes
      if (attrName.startsWith('data-')) {
        result.dataAttributes.push(attrName);
      }

      // Collect inline styles
      if (attrName === 'style' && attrValue) {
        const inlineStyle = this.parseInlineStyle(attrValue);
        if (Object.keys(inlineStyle).length > 0) {
          result.inlineStyles.push({
            element: element.tagName.toLowerCase(),
            styles: inlineStyle,
          });
        }
      }
    }

    // Check accessibility issues
    this.checkAccessibility(element, result.accessibility);

    // Add element to results
    result.elements.push(elementInfo);
  }

  /**
   * Parse inline style attribute
   */
  private parseInlineStyle(styleString: string): Record<string, string> {
    const styles: Record<string, string> = {};
    
    // Split by semicolon and parse each declaration
    const declarations = styleString.split(';').filter(Boolean);
    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > 0) {
        const property = declaration.substring(0, colonIndex).trim();
        const value = declaration.substring(colonIndex + 1).trim();
        if (property && value) {
          styles[property] = value;
        }
      }
    }

    return styles;
  }

  /**
   * Check accessibility issues
   */
  private checkAccessibility(element: HTMLElement, accessibility: AccessibilityInfo): void {
    const tagName = element.tagName?.toLowerCase();
    const attributes = element.attributes || {};

    // Check buttons without aria-label
    if (tagName === 'button' || attributes.role === 'button') {
      if (!attributes['aria-label'] && !attributes['aria-labelledby']) {
        const textContent = element.text?.trim();
        if (!textContent) {
          accessibility.missingLabels.push(`${tagName} without label`);
        }
      }
    }

    // Check images without alt text
    if (tagName === 'img') {
      if (!attributes.alt && attributes.role !== 'presentation') {
        accessibility.missingAlts.push(attributes.src || 'unknown image');
      }
    }

    // Check form inputs without labels
    if (['input', 'select', 'textarea'].includes(tagName || '')) {
      if (!attributes['aria-label'] && !attributes['aria-labelledby'] && !attributes.id) {
        accessibility.missingLabels.push(`${tagName} without label`);
      }
    }

    // Check links without text or aria-label
    if (tagName === 'a') {
      const textContent = element.text?.trim();
      if (!textContent && !attributes['aria-label']) {
        accessibility.missingLabels.push('link without text or label');
      }
    }
  }

  /**
   * Check if document has aria labels
   */
  private hasAriaLabels(root: HTMLElement): boolean {
    const elements = root.querySelectorAll('[aria-label], [aria-labelledby]');
    return elements.length > 0;
  }

  /**
   * Check if images have alt texts
   */
  private hasAltTexts(root: HTMLElement): boolean {
    const images = root.querySelectorAll('img');
    if (images.length === 0) return true;
    
    return images.some((img) => {
      const alt = img.getAttribute('alt');
      return alt !== null && alt !== undefined;
    });
  }

  /**
   * Find drift patterns in HTML
   */
  findHTMLDriftPatterns(result: HTMLAnalysisResult): {
    inlineStyles: InlineStyleInfo[];
    customElements: string[];
    classInconsistency: string[];
    accessibilityDrift: string[];
    hardcodedValues: string[];
  } {
    const patterns = {
      inlineStyles: result.inlineStyles,
      customElements: [] as string[],
      classInconsistency: [] as string[],
      accessibilityDrift: [] as string[],
      hardcodedValues: [] as string[],
    };

    // Find custom button elements (should use Button component)
    for (const element of result.elements) {
      if (element.tagName === 'button') {
        // Check if it's using custom classes instead of component
        if (element.attributes.class && !element.attributes.class.includes('btn')) {
          patterns.customElements.push('button');
        }
      }

      // Find hardcoded width/height attributes
      if (element.attributes.width || element.attributes.height) {
        patterns.hardcodedValues.push(`${element.tagName} with hardcoded dimensions`);
      }

      // Check for inconsistent class naming
      if (element.attributes.class) {
        const classes = element.attributes.class.split(/\s+/);
        for (const cls of classes) {
          // Check for non-standard naming patterns
          if (cls.includes('_') && cls.includes('-')) {
            patterns.classInconsistency.push(cls);
          }
        }
      }
    }

    // Accessibility drift
    patterns.accessibilityDrift = [
      ...result.accessibility.missingLabels,
      ...result.accessibility.missingAlts,
    ];

    return patterns;
  }

  /**
   * Batch process multiple HTML files
   */
  async analyzeHTMLFiles(filePaths: string[]): Promise<HTMLAnalysisResult[]> {
    const results: HTMLAnalysisResult[] = [];

    for (const filePath of filePaths) {
      const htmlAnalysis = await this.parseHTMLFile(filePath);
      results.push(htmlAnalysis);
    }

    return results;
  }
}