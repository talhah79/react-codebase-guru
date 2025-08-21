/**
 * Unit tests for HTMLAnalyzer
 */

import { HTMLAnalyzer } from '../../src/analyzers/htmlAnalyzer';
import { TestFileSystem, testFiles } from '../setup';
import * as path from 'path';

describe('HTMLAnalyzer', () => {
  let analyzer: HTMLAnalyzer;
  let testFS: TestFileSystem;

  beforeEach(async () => {
    analyzer = new HTMLAnalyzer();
    testFS = new TestFileSystem();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe('parseHTMLFile', () => {
    test('should parse HTML file and extract elements', async () => {
      const projectPath = await testFS.createTestProject('test-html', {
        'public/index.html': testFiles.htmlFile,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'public/index.html')
      );

      expect(result.success).toBe(true);
      expect(result.elements.length).toBeGreaterThan(0);
      
      // Check if button elements were found
      const buttons = result.elements.filter(e => e.tagName === 'button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check classes
      expect(result.classes).toContain('container');
      expect(result.classes).toContain('btn');
      expect(result.classes).toContain('btn-primary');
      
      // Check IDs
      expect(result.ids).toContain('username');
    });

    test('should detect inline styles', async () => {
      const projectPath = await testFS.createTestProject('test-inline-styles', {
        'public/index.html': testFiles.htmlFile,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'public/index.html')
      );

      expect(result.inlineStyles.length).toBeGreaterThan(0);
      
      // Find the button with inline styles
      const inlineButton = result.inlineStyles.find(s => s.element === 'button');
      expect(inlineButton).toBeDefined();
      expect(inlineButton?.styles.background).toBe('blue');
      expect(inlineButton?.styles.color).toBe('white');
    });

    test('should detect accessibility issues', async () => {
      const projectPath = await testFS.createTestProject('test-a11y', {
        'public/index.html': testFiles.htmlFile,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'public/index.html')
      );

      // Should find missing alt text on second image
      expect(result.accessibility.missingAlts.length).toBeGreaterThan(0);
      
      // Should find input without label
      expect(result.accessibility.missingLabels.length).toBeGreaterThan(0);
      
      // Should detect aria-labels where present
      expect(result.accessibility.hasAriaLabels).toBe(true);
    });

    test('should extract data attributes', async () => {
      const htmlWithDataAttrs = `
        <!DOCTYPE html>
        <html>
        <body>
          <div data-testid="container" data-value="123">
            <button data-action="submit">Submit</button>
          </div>
        </body>
        </html>
      `;

      const projectPath = await testFS.createTestProject('test-data-attrs', {
        'index.html': htmlWithDataAttrs,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'index.html')
      );

      expect(result.dataAttributes).toContain('data-testid');
      expect(result.dataAttributes).toContain('data-value');
      expect(result.dataAttributes).toContain('data-action');
    });

    test('should handle malformed HTML gracefully', async () => {
      const malformedHTML = `
        <html>
        <body>
          <div>Unclosed div
          <p>Paragraph without closing tag
          <button>Button</button>
        </body>
        </html>
      `;

      const projectPath = await testFS.createTestProject('test-malformed-html', {
        'malformed.html': malformedHTML,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'malformed.html')
      );

      // node-html-parser is forgiving and should still parse
      expect(result.success).toBe(true);
      expect(result.elements.length).toBeGreaterThan(0);
    });
  });

  describe('findHTMLDriftPatterns', () => {
    test('should detect drift patterns in HTML', async () => {
      const projectPath = await testFS.createTestProject('test-drift', {
        'public/index.html': testFiles.htmlFile,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'public/index.html')
      );

      const patterns = analyzer.findHTMLDriftPatterns(result);

      // Should detect inline styles
      expect(patterns.inlineStyles.length).toBeGreaterThan(0);
      
      // Should detect accessibility drift
      expect(patterns.accessibilityDrift.length).toBeGreaterThan(0);
    });

    test('should detect hardcoded dimensions', async () => {
      const htmlWithDimensions = `
        <html>
        <body>
          <img src="test.jpg" width="300" height="200">
          <table width="100%">
            <tr><td>Cell</td></tr>
          </table>
        </body>
        </html>
      `;

      const projectPath = await testFS.createTestProject('test-dimensions', {
        'index.html': htmlWithDimensions,
      });

      const result = await analyzer.parseHTMLFile(
        path.join(projectPath, 'index.html')
      );

      const patterns = analyzer.findHTMLDriftPatterns(result);

      expect(patterns.hardcodedValues.length).toBeGreaterThan(0);
      expect(patterns.hardcodedValues).toContain('img with hardcoded dimensions');
      expect(patterns.hardcodedValues).toContain('table with hardcoded dimensions');
    });
  });

  describe('analyzeHTMLFiles', () => {
    test('should batch process multiple HTML files', async () => {
      const html1 = `<html><body><h1>Page 1</h1></body></html>`;
      const html2 = `<html><body><h1>Page 2</h1></body></html>`;

      const projectPath = await testFS.createTestProject('test-batch-html', {
        'page1.html': html1,
        'page2.html': html2,
      });

      const results = await analyzer.analyzeHTMLFiles([
        path.join(projectPath, 'page1.html'),
        path.join(projectPath, 'page2.html'),
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });
});