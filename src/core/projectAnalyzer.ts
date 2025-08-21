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
  AnalyzerOptions 
} from '../types';
import { ComponentAnalyzer, CSSAnalyzer, HTMLAnalyzer } from '../analyzers';
import { FileDiscovery } from '../utils/fileDiscovery';
import { PatternExtractor } from '../patterns/patternExtractor';
import { PatternStorage } from '../patterns/patternStorage';
import { DriftAnalyzer } from '../drift-detector/driftAnalyzer';
import { ConfigLoader } from '../config/configLoader';
import { MarkdownReporter } from '../reporters/markdownReporter';

export class ProjectAnalyzer {
  private componentAnalyzer: ComponentAnalyzer;
  private cssAnalyzer: CSSAnalyzer;
  private htmlAnalyzer: HTMLAnalyzer;
  private fileDiscovery: FileDiscovery;
  private patternExtractor: PatternExtractor;
  private patternStorage: PatternStorage;
  private configLoader: ConfigLoader;
  private driftAnalyzer: DriftAnalyzer | null = null;
  private reporter: MarkdownReporter;
  private options: AnalyzerOptions;

  constructor(options: AnalyzerOptions) {
    this.options = options;
    this.componentAnalyzer = new ComponentAnalyzer();
    this.cssAnalyzer = new CSSAnalyzer();
    this.htmlAnalyzer = new HTMLAnalyzer();
    this.patternExtractor = new PatternExtractor();
    this.patternStorage = new PatternStorage(options.projectPath);
    this.configLoader = new ConfigLoader(options.projectPath);
    this.reporter = new MarkdownReporter();
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

    // Load configuration
    const config = await this.configLoader.loadConfig();

    // Extract patterns
    console.log(chalk.blue('🔍 Learning design patterns...'));
    const patterns = this.patternExtractor.extractPatterns({
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework,
      components,
      styles,
      templates,
      patterns: [],
      violations: [],
      compliance: { score: 0, totalFiles: 0, filesWithViolations: 0, totalViolations: 0 },
    });

    // Save patterns
    await this.patternStorage.savePatterns(patterns);
    const storedPatterns = await this.patternStorage.loadPatterns();
    const patternInfos = storedPatterns ? 
      this.patternStorage.convertToPatternInfo(storedPatterns.patterns) : [];

    // Perform drift detection
    console.log(chalk.blue('🎯 Detecting drift violations...'));
    this.driftAnalyzer = new DriftAnalyzer(config);
    this.driftAnalyzer.setPatterns(patterns);
    
    const tempAnalysis: ProjectAnalysis = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework,
      components,
      styles,
      templates,
      patterns: patternInfos,
      violations: [],
      compliance: { score: 0, totalFiles: 0, filesWithViolations: 0, totalViolations: 0 },
    };

    const driftResult = this.driftAnalyzer.analyzeForDrift(tempAnalysis);
    const violations = driftResult.violations;

    // Calculate compliance score
    const compliance = {
      score: driftResult.complianceScore,
      totalFiles: files.react.length + files.css.length + files.html.length,
      filesWithViolations: new Set(violations.map(v => v.filePath)).size,
      totalViolations: violations.length,
    };

    const analysis: ProjectAnalysis = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      framework,
      components,
      styles,
      templates,
      patterns: patternInfos,
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

  /**
   * Generate markdown report
   */
  async generateReport(analysis: ProjectAnalysis, outputPath?: string): Promise<string> {
    if (!this.driftAnalyzer) {
      const config = await this.configLoader.loadConfig();
      this.driftAnalyzer = new DriftAnalyzer(config);
    }

    const driftResult = this.driftAnalyzer.analyzeForDrift(analysis);
    const storedPatterns = await this.patternStorage.loadPatterns();
    
    const defaultPath = path.join(this.options.projectPath, '.codebase-guru', 'report.md');
    const reportPath = outputPath || defaultPath;

    const markdown = await this.reporter.generateReport(
      analysis,
      driftResult,
      storedPatterns?.patterns,
      {
        includePatterns: true,
        includeViolations: true,
        includeSummary: true,
        includeRecommendations: true,
        outputPath: reportPath,
      }
    );

    console.log(chalk.green(`📝 Report saved to: ${reportPath}`));
    return markdown;
  }
}