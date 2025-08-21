/**
 * Main project analyzer that coordinates all analysis operations
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { 
  ProjectAnalysis, 
  ComponentInfo, 
  CSSAnalysisResult, 
  HTMLAnalysisResult,
  DriftViolation,
  AnalyzerOptions 
} from '../types';
import { ComponentAnalyzer, CSSAnalyzer, HTMLAnalyzer } from '../analyzers';
import { FileDiscovery } from '../utils/fileDiscovery';

export class ProjectAnalyzer {
  private componentAnalyzer: ComponentAnalyzer;
  private cssAnalyzer: CSSAnalyzer;
  private htmlAnalyzer: HTMLAnalyzer;
  private fileDiscovery: FileDiscovery;
  private options: AnalyzerOptions;

  constructor(options: AnalyzerOptions) {
    this.options = options;
    this.componentAnalyzer = new ComponentAnalyzer();
    this.cssAnalyzer = new CSSAnalyzer();
    this.htmlAnalyzer = new HTMLAnalyzer();
    this.fileDiscovery = new FileDiscovery({
      projectPath: options.projectPath,
      include: options.include,
      exclude: options.exclude,
    });
  }

  /**
   * Analyze the entire project
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    console.log(chalk.blue('🔍 Starting project analysis...'));

    // Check if valid project
    if (!(await this.fileDiscovery.isValidProject())) {
      throw new Error('Not a valid React project directory');
    }

    // Get project stats
    const stats = await this.fileDiscovery.getProjectStats();
    console.log(chalk.gray(`Found ${stats.totalFiles} files to analyze`));

    // Discover files
    console.log(chalk.blue('📁 Discovering files...'));
    const files = await this.fileDiscovery.findAllFiles();
    
    console.log(chalk.gray(`  React files: ${files.react.length}`));
    console.log(chalk.gray(`  CSS files: ${files.css.length}`));
    console.log(chalk.gray(`  HTML files: ${files.html.length}`));

    // Analyze components
    console.log(chalk.blue('⚛️  Analyzing React components...'));
    const components = await this.analyzeComponents(files.react);

    // Analyze styles
    console.log(chalk.blue('🎨 Analyzing stylesheets...'));
    const styles = await this.analyzeStyles(files.css);

    // Analyze templates
    console.log(chalk.blue('📄 Analyzing HTML templates...'));
    const templates = await this.analyzeTemplates(files.html);

    // Detect framework info
    const framework = await this.detectFramework();

    // Calculate initial violations (basic detection)
    const violations = this.detectBasicViolations(components, styles, templates);

    // Calculate compliance score
    const compliance = this.calculateCompliance(files, violations);

    const analysis: ProjectAnalysis = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework,
      components,
      styles,
      templates,
      patterns: [], // Will be populated in pattern recognition phase
      violations,
      compliance,
    };

    console.log(chalk.green('✅ Analysis complete!'));
    console.log(chalk.yellow(`📊 Compliance score: ${compliance.score}%`));
    console.log(chalk.yellow(`⚠️  Violations found: ${violations.length}`));

    return analysis;
  }

  /**
   * Analyze React components
   */
  private async analyzeComponents(filePaths: string[]): Promise<ComponentInfo[]> {
    const results: ComponentInfo[] = [];
    const total = filePaths.length;
    let processed = 0;

    for (const filePath of filePaths) {
      if (this.options.verbose) {
        const fileName = path.basename(filePath);
        process.stdout.write(`\r  Processing: ${fileName} (${++processed}/${total})`);
      }
      
      const componentInfo = await this.componentAnalyzer.parseReactComponent(filePath);
      results.push(componentInfo);
    }

    if (this.options.verbose) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }

    return results;
  }

  /**
   * Analyze CSS files
   */
  private async analyzeStyles(filePaths: string[]): Promise<CSSAnalysisResult[]> {
    const results: CSSAnalysisResult[] = [];
    const total = filePaths.length;
    let processed = 0;

    for (const filePath of filePaths) {
      if (this.options.verbose) {
        const fileName = path.basename(filePath);
        process.stdout.write(`\r  Processing: ${fileName} (${++processed}/${total})`);
      }

      const cssAnalysis = await this.cssAnalyzer.parseCSSFile(filePath);
      results.push(cssAnalysis);
    }

    if (this.options.verbose) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }

    return results;
  }

  /**
   * Analyze HTML templates
   */
  private async analyzeTemplates(filePaths: string[]): Promise<HTMLAnalysisResult[]> {
    const results: HTMLAnalysisResult[] = [];
    const total = filePaths.length;
    let processed = 0;

    for (const filePath of filePaths) {
      if (this.options.verbose) {
        const fileName = path.basename(filePath);
        process.stdout.write(`\r  Processing: ${fileName} (${++processed}/${total})`);
      }

      const htmlAnalysis = await this.htmlAnalyzer.parseHTMLFile(filePath);
      results.push(htmlAnalysis);
    }

    if (this.options.verbose) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }

    return results;
  }

  /**
   * Detect framework information
   */
  private async detectFramework(): Promise<ProjectAnalysis['framework']> {
    const packageJsonPath = path.join(this.options.projectPath, 'package.json');
    let packageJson: any = {};

    try {
      packageJson = await fs.readJson(packageJsonPath);
    } catch {
      // Package.json not found or invalid
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Detect framework type
    let type = 'react';
    if ('next' in deps) type = 'next';
    if ('gatsby' in deps) type = 'gatsby';
    if ('remix' in deps) type = 'remix';

    // Detect TypeScript
    const typescript = 'typescript' in deps;

    // Detect CSS framework
    let cssFramework: string | undefined;
    if ('tailwindcss' in deps) cssFramework = 'tailwind';
    else if ('bootstrap' in deps) cssFramework = 'bootstrap';
    else if ('styled-components' in deps) cssFramework = 'styled-components';
    else if ('@emotion/react' in deps || '@emotion/styled' in deps) cssFramework = 'emotion';

    return {
      type,
      version: deps.react || deps.next || undefined,
      typescript,
      cssFramework,
    };
  }

  /**
   * Detect basic violations (more sophisticated detection in drift-detector module)
   */
  private detectBasicViolations(
    components: ComponentInfo[],
    styles: CSSAnalysisResult[],
    templates: HTMLAnalysisResult[]
  ): DriftViolation[] {
    const violations: DriftViolation[] = [];

    // Check for inline styles in components
    for (const component of components) {
      if (component.styling?.type === 'inline') {
        violations.push({
          type: 'inline-styles',
          severity: 'warning',
          filePath: component.filePath,
          message: 'Component uses inline styles instead of design system',
          suggestedFix: 'Use CSS classes or styled-components',
        });
      }
    }

    // Check for hardcoded colors in CSS
    for (const style of styles) {
      const hardcodedColors = style.colors.filter(
        color => color.startsWith('#') || color.includes('rgb')
      );
      if (hardcodedColors.length > 0) {
        violations.push({
          type: 'hardcoded-colors',
          severity: 'warning',
          filePath: style.filePath,
          message: `Found ${hardcodedColors.length} hardcoded colors`,
          suggestedFix: 'Use CSS variables or design tokens',
        });
      }
    }

    // Check for accessibility issues in HTML
    for (const template of templates) {
      if (template.accessibility.missingLabels.length > 0) {
        violations.push({
          type: 'accessibility',
          severity: 'error',
          filePath: template.filePath,
          message: `Missing labels for ${template.accessibility.missingLabels.length} elements`,
          suggestedFix: 'Add aria-label or proper label elements',
        });
      }
    }

    return violations;
  }

  /**
   * Calculate compliance score
   */
  private calculateCompliance(
    files: { react: string[]; css: string[]; html: string[] },
    violations: DriftViolation[]
  ): ProjectAnalysis['compliance'] {
    const totalFiles = files.react.length + files.css.length + files.html.length;
    const filesWithViolations = new Set(violations.map(v => v.filePath)).size;
    const totalViolations = violations.length;

    // Calculate score (100% = no violations)
    let score = 100;
    if (totalFiles > 0) {
      const violationRate = filesWithViolations / totalFiles;
      score = Math.round((1 - violationRate) * 100);
    }

    return {
      score,
      totalFiles,
      filesWithViolations,
      totalViolations,
    };
  }

  /**
   * Generate JSON output
   */
  async saveAnalysis(analysis: ProjectAnalysis, outputPath?: string): Promise<string> {
    const defaultPath = path.join(this.options.projectPath, '.codebase-guru', 'analysis.json');
    const savePath = outputPath || defaultPath;

    await fs.ensureDir(path.dirname(savePath));
    await fs.writeJson(savePath, analysis, { spaces: 2 });

    console.log(chalk.green(`💾 Analysis saved to: ${savePath}`));
    return savePath;
  }
}