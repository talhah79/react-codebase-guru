/**
 * Unit tests for ComponentAnalyzer
 */

import { ComponentAnalyzer } from '../../src/analyzers/componentAnalyzer';
import { TestFileSystem, testFiles } from '../setup';
import * as path from 'path';

describe('ComponentAnalyzer', () => {
  let analyzer: ComponentAnalyzer;
  let testFS: TestFileSystem;

  beforeEach(async () => {
    analyzer = new ComponentAnalyzer();
    testFS = new TestFileSystem();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe('parseReactComponent', () => {
    test('should parse TypeScript React component', async () => {
      const projectPath = await testFS.createTestProject('test-ts', {
        'src/Button.tsx': testFiles.tsxComponent,
      });

      const result = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/Button.tsx')
      );

      expect(result.success).toBe(true);
      expect(result.name).toBe('Button');
      expect(result.type).toBe('functional');
      expect(result.hasJSX).toBe(true);
      expect(result.props).toBeDefined();
      expect(result.props?.length).toBeGreaterThan(0);
      
      const variantProp = result.props?.find(p => p.name === 'variant');
      expect(variantProp).toBeDefined();
      expect(variantProp?.required).toBe(true);
      
      const sizeProp = result.props?.find(p => p.name === 'size');
      expect(sizeProp).toBeDefined();
      expect(sizeProp?.required).toBe(false);
      expect(sizeProp?.defaultValue).toBe("'md'");
    });

    test('should parse JavaScript React component', async () => {
      const projectPath = await testFS.createTestProject('test-js', {
        'src/Card.jsx': testFiles.jsxComponent,
      });

      const result = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/Card.jsx')
      );

      expect(result.success).toBe(true);
      expect(result.name).toBe('Card');
      expect(result.type).toBe('functional');
      expect(result.hasJSX).toBe(true);
      expect(result.props).toBeDefined();
      
      const titleProp = result.props?.find(p => p.name === 'title');
      expect(titleProp).toBeDefined();
      expect(titleProp?.required).toBe(true);
    });

    test('should handle malformed components gracefully', async () => {
      const projectPath = await testFS.createTestProject('test-malformed', {
        'src/Broken.tsx': testFiles.malformedComponent,
      });

      const result = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/Broken.tsx')
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('syntax-error');
      expect(result.errorMessage).toBeDefined();
    });

    test('should detect component type correctly', async () => {
      const functionalComponent = `
        import React from 'react';
        const MyComponent = () => <div>Hello</div>;
        export default MyComponent;
      `;

      const classComponent = `
        import React from 'react';
        class MyComponent extends React.Component {
          render() {
            return <div>Hello</div>;
          }
        }
        export default MyComponent;
      `;

      const projectPath = await testFS.createTestProject('test-types', {
        'src/Functional.jsx': functionalComponent,
        'src/Class.jsx': classComponent,
      });

      const functionalResult = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/Functional.jsx')
      );
      expect(functionalResult.type).toBe('functional');

      const classResult = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/Class.jsx')
      );
      expect(classResult.type).toBe('class');
    });

    test('should detect styling approach', async () => {
      const tailwindComponent = `
        import React from 'react';
        export const Button = () => (
          <button className="bg-blue-500 text-white p-4 m-2">Click</button>
        );
      `;

      const styledComponent = `
        import React from 'react';
        import styled from 'styled-components';
        const StyledButton = styled.button\`
          background: blue;
        \`;
        export const Button = () => <StyledButton>Click</StyledButton>;
      `;

      const projectPath = await testFS.createTestProject('test-styling', {
        'src/TailwindButton.jsx': tailwindComponent,
        'src/StyledButton.jsx': styledComponent,
      });

      const tailwindResult = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/TailwindButton.jsx')
      );
      expect(tailwindResult.styling?.type).toBe('tailwind');

      const styledResult = await analyzer.parseReactComponent(
        path.join(projectPath, 'src/StyledButton.jsx')
      );
      expect(styledResult.styling?.type).toBe('styled-components');
    });
  });

  describe('analyzeComponents', () => {
    test('should batch process multiple component files', async () => {
      const projectPath = await testFS.createTestProject('test-batch', {
        'src/Button.tsx': testFiles.tsxComponent,
        'src/Card.jsx': testFiles.jsxComponent,
      });

      const filePaths = [
        path.join(projectPath, 'src/Button.tsx'),
        path.join(projectPath, 'src/Card.jsx'),
      ];

      const results = await analyzer.analyzeComponents(filePaths);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Button');
      expect(results[1].name).toBe('Card');
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});