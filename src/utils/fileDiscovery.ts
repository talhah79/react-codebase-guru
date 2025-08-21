/**
 * File discovery utilities using glob patterns
 */

import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface FileDiscoveryOptions {
  projectPath: string;
  include?: string[];
  exclude?: string[];
  extensions?: string[];
}

export class FileDiscovery {
  private projectPath: string;
  private includePatterns: string[];
  private excludePatterns: string[];

  constructor(options: FileDiscoveryOptions) {
    this.projectPath = path.resolve(options.projectPath);
    this.includePatterns = options.include || [
      'src/**/*',
      'components/**/*',
      'pages/**/*',
      'app/**/*',
    ];
    this.excludePatterns = options.exclude || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
    ];
  }

  /**
   * Discover React component files
   */
  async findReactFiles(): Promise<string[]> {
    const patterns = this.includePatterns.map(p => 
      path.join(this.projectPath, p + '.{js,jsx,ts,tsx}')
    );

    const files = await this.findFiles(patterns, ['.js', '.jsx', '.ts', '.tsx']);
    return this.filterByContent(files, this.isReactFile);
  }

  /**
   * Discover CSS files
   */
  async findCSSFiles(): Promise<string[]> {
    const patterns = this.includePatterns.map(p => 
      path.join(this.projectPath, p + '.{css,scss,sass,less}')
    );

    return this.findFiles(patterns, ['.css', '.scss', '.sass', '.less']);
  }

  /**
   * Discover HTML template files
   */
  async findHTMLFiles(): Promise<string[]> {
    const patterns = [
      path.join(this.projectPath, '**/*.{html,htm}'),
      path.join(this.projectPath, 'public/**/*.{html,htm}'),
      path.join(this.projectPath, 'templates/**/*.{html,htm}'),
    ];

    return this.findFiles(patterns, ['.html', '.htm']);
  }

  /**
   * Find all files matching patterns
   */
  async findAllFiles(): Promise<{
    react: string[];
    css: string[];
    html: string[];
  }> {
    const [react, css, html] = await Promise.all([
      this.findReactFiles(),
      this.findCSSFiles(),
      this.findHTMLFiles(),
    ]);

    return { react, css, html };
  }

  /**
   * Find files matching glob patterns
   */
  private async findFiles(patterns: string[], extensions: string[]): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          ignore: this.excludePatterns,
          nodir: true,
          absolute: true,
        });
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Warning: Pattern "${pattern}" failed:`, error);
      }
    }

    // Filter by extension if specified
    let filteredFiles = allFiles;
    if (extensions.length > 0) {
      filteredFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      });
    }

    // Remove duplicates and sort
    return [...new Set(filteredFiles)].sort();
  }

  /**
   * Filter files by content check
   */
  private async filterByContent(
    files: string[],
    contentCheck: (content: string) => boolean
  ): Promise<string[]> {
    const results: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (contentCheck(content)) {
          results.push(file);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Check if file contains React code
   */
  private isReactFile(content: string): boolean {
    // Check for React imports
    if (/import\s+.*\s+from\s+['"]react['"]/.test(content)) {
      return true;
    }

    // Check for JSX
    if (/<[A-Z]\w*[\s/>]/.test(content) || /<[a-z]+\s+[^>]*\/>/.test(content)) {
      return true;
    }

    // Check for React.createElement
    if (/React\.createElement/.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    totalFiles: number;
    reactFiles: number;
    cssFiles: number;
    htmlFiles: number;
    projectSize: number;
  }> {
    const files = await this.findAllFiles();
    
    let totalSize = 0;
    const allFiles = [...files.react, ...files.css, ...files.html];
    
    for (const file of allFiles) {
      try {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      } catch {
        // Skip files that can't be accessed
      }
    }

    return {
      totalFiles: allFiles.length,
      reactFiles: files.react.length,
      cssFiles: files.css.length,
      htmlFiles: files.html.length,
      projectSize: totalSize,
    };
  }

  /**
   * Check if path is a valid project directory
   */
  async isValidProject(): Promise<boolean> {
    try {
      // Check if directory exists
      const stats = await fs.stat(this.projectPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check for package.json
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Check if it's a React project
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        
        return 'react' in deps || 'next' in deps || 'gatsby' in deps;
      }

      // Check for common React project structures
      const commonPaths = [
        'src/App.js',
        'src/App.jsx',
        'src/App.tsx',
        'pages/index.js',
        'pages/index.jsx',
        'pages/index.tsx',
      ];

      for (const commonPath of commonPaths) {
        if (await fs.pathExists(path.join(this.projectPath, commonPath))) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}