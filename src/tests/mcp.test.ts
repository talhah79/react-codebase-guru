/**
 * MCP Server and Protocol Tests
 */

import { MCPServer } from '../mcp/server';
import { MCPClient } from '../mcp/client';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

describe('MCP Server', () => {
  let server: MCPServer;
  let client: MCPClient;
  const testProjectPath = path.join(os.tmpdir(), 'test-mcp-project');

  beforeEach(async () => {
    // Create test project structure
    await fs.ensureDir(testProjectPath);
    await fs.writeFile(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );
    
    // Create test components
    const componentsDir = path.join(testProjectPath, 'src', 'components');
    await fs.ensureDir(componentsDir);
    
    await fs.writeFile(
      path.join(componentsDir, 'Button.tsx'),
      `
      interface ButtonProps {
        variant: 'primary' | 'secondary';
        onClick: () => void;
      }
      export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
        return <button className={\`btn btn-\${variant}\`} onClick={onClick} />;
      };
      `
    );

    await fs.writeFile(
      path.join(componentsDir, 'Card.tsx'),
      `
      export const Card = ({ children }) => {
        return <div className="card">{children}</div>;
      };
      `
    );

    // Initialize server
    server = new MCPServer({
      projectPath: testProjectPath,
      enableRealTime: false,
      enableLogging: false,
    });

    client = new MCPClient();
  });

  afterEach(async () => {
    await fs.remove(testProjectPath);
    if (server) {
      await server.stop();
    }
    if (client) {
      await client.disconnect();
    }
  });

  describe('Core Functions', () => {
    it('should handle consult_before_change', async () => {
      const mockCallTool = jest.spyOn(server as any, 'consultBeforeChange');
      
      const result = await (server as any).consultBeforeChange({
        intent: 'Add a button to the dashboard',
        targetFiles: ['src/Dashboard.tsx'],
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const guidance = JSON.parse(result.content[0].text);
      expect(guidance).toHaveProperty('styling');
      expect(guidance).toHaveProperty('existingPatterns');
      expect(guidance).toHaveProperty('warnings');
      expect(guidance).toHaveProperty('confidence');
    });

    it('should validate proposed code', async () => {
      const codeWithIssues = `
        <button style={{backgroundColor: 'red', padding: '13px'}}>
          Click me
        </button>
      `;

      const result = await (server as any).validateProposedCode({
        code: codeWithIssues,
        filePath: 'src/Test.tsx',
      });

      expect(result).toBeDefined();
      const validation = JSON.parse(result.content[0].text);
      
      expect(validation.compliant).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.complianceScore).toBeLessThan(100);
    });

    it('should provide component recommendations', async () => {
      const result = await (server as any).getComponentRecommendations({
        description: 'button for submitting forms',
      });

      expect(result).toBeDefined();
      const recommendations = JSON.parse(result.content[0].text);
      
      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('name');
        expect(recommendations[0]).toHaveProperty('path');
        expect(recommendations[0]).toHaveProperty('similarity');
      }
    });

    it('should check style compliance', async () => {
      const result = await (server as any).checkStyleCompliance({
        styles: {
          backgroundColor: '#ff0000',
          padding: '13px',
          fontSize: '17px',
        },
        context: 'Dashboard component',
      });

      expect(result).toBeDefined();
      const compliance = JSON.parse(result.content[0].text);
      
      expect(compliance).toHaveProperty('compliant');
      expect(compliance).toHaveProperty('violations');
      expect(compliance).toHaveProperty('suggestions');
      expect(compliance).toHaveProperty('complianceScore');
    });

    it('should get current patterns', async () => {
      const result = await (server as any).getCurrentPatterns({
        category: 'spacing',
      });

      expect(result).toBeDefined();
      const snapshot = JSON.parse(result.content[0].text);
      
      expect(snapshot).toHaveProperty('patterns');
      expect(snapshot).toHaveProperty('components');
      expect(snapshot).toHaveProperty('compliance');
      expect(snapshot).toHaveProperty('lastUpdated');
    });

    it('should analyze drift', async () => {
      const result = await (server as any).analyzeDrift({
        includeDetails: true,
      });

      expect(result).toBeDefined();
      const analysis = JSON.parse(result.content[0].text);
      
      expect(analysis).toHaveProperty('complianceScore');
      expect(analysis).toHaveProperty('violationCount');
      expect(analysis).toHaveProperty('summary');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimiter = (server as any).rateLimiter;
      const toolName = 'test_tool';
      
      // Simulate max requests
      const now = Date.now();
      const requests = Array(100).fill(now);
      rateLimiter.set(toolName, requests);

      const allowed = (server as any).checkRateLimit(toolName);
      expect(allowed).toBe(false);
    });

    it('should allow requests after rate limit window', async () => {
      const rateLimiter = (server as any).rateLimiter;
      const toolName = 'test_tool';
      
      // Simulate old requests (outside window)
      const oldTime = Date.now() - 70000; // 70 seconds ago
      const requests = Array(100).fill(oldTime);
      rateLimiter.set(toolName, requests);

      const allowed = (server as any).checkRateLimit(toolName);
      expect(allowed).toBe(true);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect component patterns', async () => {
      await (server as any).refreshPatterns();
      const patterns = (server as any).patterns;
      
      expect(patterns).toBeDefined();
      expect(patterns).toHaveProperty('spacing');
      expect(patterns).toHaveProperty('colors');
      expect(patterns).toHaveProperty('typography');
    });

    it('should find components by type', () => {
      (server as any).patterns = {
        components: [
          { name: 'Button', usage: 10 },
          { name: 'SubmitButton', usage: 5 },
          { name: 'Card', usage: 8 },
        ],
      };

      const buttons = (server as any).findComponentsByType('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].name).toBe('Button');
    });
  });

  describe('Validation Logic', () => {
    it('should detect inline styles', async () => {
      const codeWithInlineStyles = `
        <div style="color: red;">Test</div>
      `;

      const result = await (server as any).validateProposedCode({
        code: codeWithInlineStyles,
        filePath: 'test.tsx',
      });

      const validation = JSON.parse(result.content[0].text);
      const inlineStyleIssue = validation.issues.find(
        (i: any) => i.type === 'inline-styles'
      );
      
      expect(inlineStyleIssue).toBeDefined();
    });

    it('should detect hardcoded colors', async () => {
      const codeWithHardcodedColors = `
        const styles = {
          color: '#ff0000',
          background: 'rgb(255, 0, 0)',
        };
      `;

      const result = await (server as any).validateProposedCode({
        code: codeWithHardcodedColors,
        filePath: 'test.tsx',
      });

      const validation = JSON.parse(result.content[0].text);
      const colorIssue = validation.issues.find(
        (i: any) => i.type === 'hardcoded-colors'
      );
      
      expect(colorIssue).toBeDefined();
    });

    it('should detect spacing violations', async () => {
      (server as any).patterns = {
        spacing: { grid: 8 },
      };

      const codeWithBadSpacing = `
        const styles = {
          margin: '13px',
          padding: '7px',
        };
      `;

      const result = await (server as any).validateProposedCode({
        code: codeWithBadSpacing,
        filePath: 'test.tsx',
      });

      const validation = JSON.parse(result.content[0].text);
      const spacingIssues = validation.issues.filter(
        (i: any) => i.type === 'spacing-drift'
      );
      
      expect(spacingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Style Compliance', () => {
    it('should validate design system colors', () => {
      (server as any).patterns = {
        colors: {
          primary: { main: '#3b82f6', dark: '#2563eb' },
          secondary: { main: '#6b7280' },
          neutrals: { white: '#ffffff', black: '#000000' },
        },
      };

      const isValid1 = (server as any).isDesignSystemColor('#3b82f6');
      const isValid2 = (server as any).isDesignSystemColor('#ff0000');

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
    });

    it('should validate font sizes', () => {
      (server as any).patterns = {
        typography: {
          fontSizes: ['12px', '14px', '16px', '18px', '24px'],
        },
      };

      const isValid1 = (server as any).isDesignSystemFontSize('16px');
      const isValid2 = (server as any).isDesignSystemFontSize('17px');

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate confidence based on evidence', () => {
      const guidance1 = {
        recommendedComponent: 'Button',
        styling: {
          colors: ['#3b82f6', '#2563eb'],
          spacing: ['8px', '16px'],
          typography: ['14px', '16px'],
        },
        existingPatterns: ['Use Button component'],
        warnings: [],
        confidence: 0,
      };

      const confidence1 = (server as any).calculateConfidence(guidance1);
      expect(confidence1).toBeGreaterThan(50);

      const guidance2 = {
        styling: { colors: [], spacing: [], typography: [] },
        existingPatterns: [],
        warnings: [],
        confidence: 0,
      };

      const confidence2 = (server as any).calculateConfidence(guidance2);
      expect(confidence2).toBe(50); // Base confidence
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names gracefully', async () => {
      await expect(
        (server as any).server.setRequestHandler('invalid_tool', {})
      ).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      const result = await (server as any).validateProposedCode({
        // Missing 'code' parameter
        filePath: 'test.tsx',
      });

      // Should handle gracefully, not crash
      expect(result).toBeDefined();
    });

    it('should use default patterns when analysis fails', async () => {
      // Force analysis to fail
      jest.spyOn(server as any, 'componentAnalyzer').mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      await (server as any).refreshPatterns();
      const patterns = (server as any).patterns;

      expect(patterns).toBeDefined();
      expect(patterns.spacing).toBeDefined(); // Should have default patterns
    });
  });
});