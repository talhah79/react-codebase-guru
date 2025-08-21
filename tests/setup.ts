/**
 * Test setup and utilities
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export class TestFileSystem {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '.temp-test-projects');
  }

  /**
   * Create a test project with given file structure
   */
  async createTestProject(name: string, structure: Record<string, string>): Promise<string> {
    const projectPath = path.join(this.tempDir, name);
    await fs.ensureDir(projectPath);

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }

    return projectPath;
  }

  /**
   * Clean up temporary test files
   */
  async cleanup(): Promise<void> {
    try {
      await fs.remove(this.tempDir);
    } catch {
      // Ignore errors during cleanup
    }
  }

  /**
   * Get the path to a test project
   */
  getProjectPath(name: string): string {
    return path.join(this.tempDir, name);
  }
}

/**
 * Sample test files for testing
 */
export const testFiles = {
  // TypeScript React component
  tsxComponent: `
import React from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size = 'md', 
  onClick,
  children 
}) => {
  return (
    <button 
      className={\`btn btn-\${variant} btn-\${size}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`,

  // JavaScript React component
  jsxComponent: `
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ title, content, footer }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {content}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

export default Card;
`,

  // CSS file
  cssFile: `
:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --spacing-unit: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}
`,

  // SCSS file
  scssFile: `
$primary-color: #3b82f6;
$secondary-color: #6b7280;
$spacing-unit: 8px;

.card {
  border: 1px solid #e5e7eb;
  border-radius: $spacing-unit;
  margin-bottom: $spacing-unit * 2;
  
  &-header {
    padding: $spacing-unit * 2;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #1f2937;
    }
  }
  
  &-body {
    padding: $spacing-unit * 2;
  }
  
  &-footer {
    padding: $spacing-unit * 2;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
}
`,

  // HTML template
  htmlFile: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <style>
    .custom-button {
      background: red;
      padding: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="btn btn-primary" aria-label="Submit form">Submit</button>
    <button style="background: blue; color: white;">Custom Button</button>
    <img src="logo.png" alt="Logo">
    <img src="banner.jpg">
    <input type="text" id="username">
    <button onclick="handleClick()">Click me</button>
  </div>
</body>
</html>
`,

  // Malformed component (for error testing)
  malformedComponent: `
import React from 'react';

export const Broken = () => {
  return <div>Missing closing brace
`,

  // Package.json for React project
  packageJson: `
{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0"
  }
}
`,
};

/**
 * Create a sample React project structure
 */
export async function createSampleProject(testFS: TestFileSystem): Promise<string> {
  return await testFS.createTestProject('sample-react-app', {
    'package.json': testFiles.packageJson,
    'src/components/Button.tsx': testFiles.tsxComponent,
    'src/components/Card.jsx': testFiles.jsxComponent,
    'src/styles/components.css': testFiles.cssFile,
    'src/styles/card.scss': testFiles.scssFile,
    'public/index.html': testFiles.htmlFile,
  });
}