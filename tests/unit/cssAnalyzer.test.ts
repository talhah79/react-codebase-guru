/**
 * Unit tests for CSSAnalyzer
 */

import { CSSAnalyzer } from '../../src/analyzers/cssAnalyzer';
import { TestFileSystem, testFiles } from '../setup';
import * as path from 'path';

describe('CSSAnalyzer', () => {
  let analyzer: CSSAnalyzer;
  let testFS: TestFileSystem;

  beforeEach(async () => {
    analyzer = new CSSAnalyzer();
    testFS = new TestFileSystem();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe('parseCSSFile', () => {
    test('should parse CSS file and extract properties', async () => {
      const projectPath = await testFS.createTestProject('test-css', {
        'src/styles.css': testFiles.cssFile,
      });

      const result = await analyzer.parseCSSFile(
        path.join(projectPath, 'src/styles.css')
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe('css');
      
      // Check selectors
      expect(result.selectors).toContain('.btn');
      expect(result.selectors).toContain('.btn-primary');
      expect(result.selectors).toContain('.btn-secondary');
      
      // Check colors
      expect(result.colors).toContain('#3b82f6');
      expect(result.colors).toContain('#6b7280');
      expect(result.colors).toContain('white');
      
      // Check spacing
      expect(result.spacing).toContain('8px');
      expect(result.spacing).toContain('16px');
      expect(result.spacing).toContain('4px');
      
      // Check font properties
      expect(result.fontSize).toContain('14px');
      expect(result.fontSize).toContain('12px');
      expect(result.fontWeight).toContain('500');
      
      // Check custom properties
      expect(result.customProperties['--primary-color']).toBe('#3b82f6');
      expect(result.customProperties['--spacing-unit']).toBe('8px');
    });

    test('should parse SCSS file', async () => {
      const projectPath = await testFS.createTestProject('test-scss', {
        'src/card.scss': testFiles.scssFile,
      });

      const result = await analyzer.parseCSSFile(
        path.join(projectPath, 'src/card.scss')
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe('scss');
      
      // SCSS should still parse basic CSS properties
      expect(result.selectors.length).toBeGreaterThan(0);
      expect(result.colors).toContain('#e5e7eb');
      expect(result.colors).toContain('#f9fafb');
    });

    test('should handle malformed CSS gracefully', async () => {
      const malformedCSS = `
        .broken {
          color: red
          background: blue /* missing semicolon above */
        }
      `;

      const projectPath = await testFS.createTestProject('test-malformed-css', {
        'src/broken.css': malformedCSS,
      });

      const result = await analyzer.parseCSSFile(
        path.join(projectPath, 'src/broken.css')
      );

      // PostCSS is forgiving and should still parse what it can
      expect(result.success).toBe(true);
      expect(result.colors).toContain('red');
      expect(result.colors).toContain('blue');
    });

    test('should extract CSS variables correctly', async () => {
      const cssWithVars = `
        :root {
          --main-color: #007bff;
          --main-spacing: 1rem;
          --font-primary: 'Helvetica', sans-serif;
        }
        
        .component {
          color: var(--main-color);
          padding: var(--main-spacing);
          font-family: var(--font-primary);
        }
      `;

      const projectPath = await testFS.createTestProject('test-css-vars', {
        'src/vars.css': cssWithVars,
      });

      const result = await analyzer.parseCSSFile(
        path.join(projectPath, 'src/vars.css')
      );

      expect(result.customProperties['--main-color']).toBe('#007bff');
      expect(result.customProperties['--main-spacing']).toBe('1rem');
      expect(result.customProperties['--font-primary']).toBe("'Helvetica', sans-serif");
      
      // Should also detect var() usage
      expect(result.colors).toContain('var(--main-color)');
    });

    test('should detect z-index values', async () => {
      const cssWithZIndex = `
        .modal {
          z-index: 1000;
        }
        .dropdown {
          z-index: 50;
        }
        .tooltip {
          z-index: 9999;
        }
      `;

      const projectPath = await testFS.createTestProject('test-z-index', {
        'src/layers.css': cssWithZIndex,
      });

      const result = await analyzer.parseCSSFile(
        path.join(projectPath, 'src/layers.css')
      );

      expect(result.zIndex).toContain('1000');
      expect(result.zIndex).toContain('50');
      expect(result.zIndex).toContain('9999');
    });
  });

  describe('extractDesignTokens', () => {
    test('should extract and consolidate design tokens from multiple files', async () => {
      const projectPath = await testFS.createTestProject('test-tokens', {
        'src/base.css': testFiles.cssFile,
        'src/card.scss': testFiles.scssFile,
      });

      const results = await analyzer.analyzeCSSFiles([
        path.join(projectPath, 'src/base.css'),
        path.join(projectPath, 'src/card.scss'),
      ]);

      const tokens = analyzer.extractDesignTokens(results);

      expect(tokens.colors.length).toBeGreaterThan(0);
      expect(tokens.spacing.length).toBeGreaterThan(0);
      expect(tokens.typography.sizes.length).toBeGreaterThan(0);
      expect(Object.keys(tokens.customProperties).length).toBeGreaterThan(0);
      
      // Should remove duplicates
      const uniqueColors = [...new Set(tokens.colors)];
      expect(tokens.colors).toEqual(uniqueColors);
    });
  });
});