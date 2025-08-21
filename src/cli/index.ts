#!/usr/bin/env node

/**
 * React Codebase Guru CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ProjectAnalyzer } from '../core/projectAnalyzer';
import { ProjectAnalysis } from '../types';
import { FileWatcher } from '../watcher/fileWatcher';
import { ConfigLoader } from '../config/configLoader';

const program = new Command();

// Package info
const packageJson = require('../../package.json');

program
  .name('guru')
  .description('React Codebase Guru - Real-time design system drift detection')
  .version(packageJson.version);

/**
 * Scan command - analyze project for drift
 */
program
  .command('scan')
  .description('Analyze your React project for design system drift')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-o, --output <path>', 'Output file path for analysis results')
  .option('-f, --format <format>', 'Output format (json, markdown)', 'json')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--include <patterns>', 'Include patterns (comma-separated)', '')
  .option('--exclude <patterns>', 'Exclude patterns (comma-separated)', '')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\n🎯 React Codebase Guru - Drift Detection\n'));

      // Parse include/exclude patterns
      const include = options.include ? options.include.split(',').map((p: string) => p.trim()) : undefined;
      const exclude = options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : undefined;

      // Create analyzer
      const analyzer = new ProjectAnalyzer({
        projectPath: path.resolve(options.path),
        include,
        exclude,
        verbose: options.verbose,
      });

      // Run analysis
      const analysis = await analyzer.analyzeProject();

      // Output results
      if (options.format === 'markdown') {
        await outputMarkdown(analysis, options.output);
      } else {
        await analyzer.saveAnalysis(analysis, options.output);
      }

      // Print summary
      printSummary(analysis);

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Init command - initialize project monitoring
 */
program
  .command('init')
  .description('Initialize React Codebase Guru in your project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\n🎯 Initializing React Codebase Guru...\n'));

      const projectPath = path.resolve(options.path);
      
      // Check if it's a valid project
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        throw new Error('No package.json found. Are you in a Node.js project directory?');
      }

      // Create config file
      const configPath = path.join(projectPath, 'guru.config.js');
      if (await fs.pathExists(configPath)) {
        console.log(chalk.yellow('⚠️  Configuration file already exists'));
      } else {
        await createDefaultConfig(configPath);
        console.log(chalk.green('✅ Created guru.config.js'));
      }

      // Create .codebase-guru directory
      const guruDir = path.join(projectPath, '.codebase-guru');
      await fs.ensureDir(guruDir);
      console.log(chalk.green('✅ Created .codebase-guru directory'));

      // Add to .gitignore
      await updateGitignore(projectPath);
      console.log(chalk.green('✅ Updated .gitignore'));

      console.log(chalk.green('\n✨ Initialization complete!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Run "guru scan" to analyze your project'));
      console.log(chalk.gray('  2. Run "guru watch" for real-time monitoring'));
      console.log(chalk.gray('  3. Edit guru.config.js to customize settings\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Watch command - real-time monitoring
 */
program
  .command('watch')
  .description('Start real-time drift detection')
  .option('-p, --path <path>', 'Project path to watch', process.cwd())
  .option('-v, --verbose', 'Verbose output', false)
  .option('--include <patterns>', 'Include patterns (comma-separated)', '')
  .option('--exclude <patterns>', 'Exclude patterns (comma-separated)', '')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
  .option('--no-notifications', 'Disable desktop notifications')
  .option('--dashboard', 'Enable interactive terminal dashboard')
  .option('--no-streaming', 'Disable real-time analysis streaming')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\n👁️  React Codebase Guru - Watch Mode\n'));

      const projectPath = path.resolve(options.path);
      
      // Load configuration
      const configLoader = new ConfigLoader(projectPath);
      const config = await configLoader.loadConfig();

      // Parse include/exclude patterns
      const include = options.include ? 
        options.include.split(',').map((p: string) => p.trim()) : 
        config.include;
      const exclude = options.exclude ? 
        options.exclude.split(',').map((p: string) => p.trim()) : 
        config.exclude;

      // Create file watcher
      const watcher = new FileWatcher({
        projectPath,
        include,
        exclude,
        debounceMs: parseInt(options.debounce),
        enableNotifications: options.notifications !== false,
        enableDashboard: options.dashboard === true,
        enableStreaming: options.streaming !== false,
        verbose: options.verbose,
      });

      // Set up event handlers (only show console output if dashboard is disabled)
      if (!options.dashboard) {
        watcher.on('ready', () => {
          console.log(chalk.green('✅ File watcher ready'));
          console.log(chalk.gray(`📁 Watching: ${projectPath}`));
          console.log(chalk.gray('🔍 Press Ctrl+C to stop watching\n'));
        });
      }

      if (!options.dashboard) {
        watcher.on('drift-detected', (changes) => {
          console.log(chalk.yellow(`\n⚠️  Drift detected in ${changes.length} file(s):`));
          
          changes.forEach((change: any) => {
            const icon = change.type === 'added' ? '➕' : 
                        change.type === 'modified' ? '📝' : '❌';
            console.log(chalk.gray(`  ${icon} ${path.relative(projectPath, change.filePath)}`));
          });
          
          console.log(chalk.gray('📊 Run "guru report" for detailed analysis\n'));
        });

        watcher.on('analysis-complete', (result) => {
          if (result.violations.length > 0) {
            const errorCount = result.violations.filter((v: any) => v.severity === 'error').length;
            const warningCount = result.violations.filter((v: any) => v.severity === 'warning').length;
            
            console.log(chalk.red(`🚨 ${errorCount} error(s), ${warningCount} warning(s) detected`));
          } else {
            console.log(chalk.green('✅ No violations detected'));
          }
        });

        watcher.on('error', (error) => {
          console.error(chalk.red('❌ Watcher error:'), error.message);
        });
      }

      // Handle graceful shutdown
      const shutdown = async () => {
        console.log(chalk.cyan('\n🛑 Stopping file watcher...'));
        await watcher.stop();
        
        const stats = watcher.getSessionStats();
        console.log(chalk.gray(`\n📊 Session Summary:`));
        console.log(chalk.gray(`   Files watched: ${stats.filesWatched}`));
        console.log(chalk.gray(`   Changes detected: ${stats.changesDetected}`));
        console.log(chalk.gray(`   Violations found: ${stats.violationsFound}`));
        console.log(chalk.gray(`   Duration: ${Math.round(stats.duration / 1000)}s`));
        
        console.log(chalk.green('\n👋 Thanks for using React Codebase Guru!\n'));
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Start watching
      await watcher.startWatching();

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Report command - generate drift report
 */
program
  .command('report')
  .description('Generate detailed drift report')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <path>', 'Output file path for report')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\n📊 Generating Drift Report...\n'));

      const projectPath = path.resolve(options.path);
      
      // Check if analysis exists
      const analysisPath = path.join(projectPath, '.codebase-guru', 'analysis.json');
      if (!(await fs.pathExists(analysisPath))) {
        console.log(chalk.yellow('No analysis found. Running scan first...'));
        
        // Run analysis
        const analyzer = new ProjectAnalyzer({
          projectPath,
          verbose: false,
        });
        
        const analysis = await analyzer.analyzeProject();
        await analyzer.saveAnalysis(analysis);
        
        // Generate report
        await analyzer.generateReport(analysis, options.output);
      } else {
        // Load existing analysis
        const analysis = await fs.readJson(analysisPath);
        
        // Generate report
        const analyzer = new ProjectAnalyzer({
          projectPath,
          verbose: false,
        });
        
        await analyzer.generateReport(analysis, options.output);
      }

      console.log(chalk.green('\n✨ Report generated successfully!\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Plan command - generate drift-aware feature plan (placeholder)
 */
program
  .command('plan <intent>')
  .description('Generate drift-aware feature plan')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async () => {
    console.log(chalk.cyan('\n🗺️  Plan generation coming soon!\n'));
    console.log(chalk.gray('This feature will be implemented in Phase 3'));
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

/**
 * Print analysis summary
 */
function printSummary(analysis: ProjectAnalysis): void {
  console.log(chalk.cyan('\n📊 Analysis Summary\n'));
  
  console.log(chalk.white('Project Information:'));
  console.log(chalk.gray(`  Path: ${analysis.projectPath}`));
  console.log(chalk.gray(`  Framework: ${analysis.framework.type}`));
  console.log(chalk.gray(`  TypeScript: ${analysis.framework.typescript ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`  CSS Framework: ${analysis.framework.cssFramework || 'None detected'}`));

  console.log(chalk.white('\nFiles Analyzed:'));
  console.log(chalk.gray(`  Components: ${analysis.components.length}`));
  console.log(chalk.gray(`  Stylesheets: ${analysis.styles.length}`));
  console.log(chalk.gray(`  Templates: ${analysis.templates.length}`));

  console.log(chalk.white('\nCompliance:'));
  const scoreColor = analysis.compliance.score >= 90 ? chalk.green :
                     analysis.compliance.score >= 70 ? chalk.yellow :
                     chalk.red;
  console.log(scoreColor(`  Score: ${analysis.compliance.score}%`));
  console.log(chalk.gray(`  Total violations: ${analysis.compliance.totalViolations}`));
  console.log(chalk.gray(`  Files with violations: ${analysis.compliance.filesWithViolations}`));

  if (analysis.violations.length > 0) {
    console.log(chalk.white('\nTop Violations:'));
    const topViolations = analysis.violations.slice(0, 5);
    topViolations.forEach(violation => {
      const icon = violation.severity === 'error' ? '❌' :
                   violation.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(chalk.gray(`  ${icon} ${violation.type}: ${violation.message}`));
    });

    if (analysis.violations.length > 5) {
      console.log(chalk.gray(`  ... and ${analysis.violations.length - 5} more`));
    }
  }

  console.log('');
}

/**
 * Output analysis as markdown
 */
async function outputMarkdown(analysis: ProjectAnalysis, outputPath?: string): Promise<void> {
  let markdown = '# React Codebase Guru - Drift Analysis Report\n\n';
  markdown += `Generated: ${new Date(analysis.timestamp).toLocaleString()}\n\n`;

  markdown += '## Project Information\n\n';
  markdown += `- **Path**: ${analysis.projectPath}\n`;
  markdown += `- **Framework**: ${analysis.framework.type}\n`;
  markdown += `- **TypeScript**: ${analysis.framework.typescript ? 'Yes' : 'No'}\n`;
  markdown += `- **CSS Framework**: ${analysis.framework.cssFramework || 'None detected'}\n\n`;

  markdown += '## Compliance Summary\n\n';
  markdown += `- **Score**: ${analysis.compliance.score}%\n`;
  markdown += `- **Total Files**: ${analysis.compliance.totalFiles}\n`;
  markdown += `- **Files with Violations**: ${analysis.compliance.filesWithViolations}\n`;
  markdown += `- **Total Violations**: ${analysis.compliance.totalViolations}\n\n`;

  if (analysis.violations.length > 0) {
    markdown += '## Violations\n\n';
    analysis.violations.forEach(violation => {
      markdown += `### ${violation.type}\n`;
      markdown += `- **File**: ${violation.filePath}\n`;
      markdown += `- **Severity**: ${violation.severity}\n`;
      markdown += `- **Message**: ${violation.message}\n`;
      if (violation.suggestedFix) {
        markdown += `- **Suggested Fix**: ${violation.suggestedFix}\n`;
      }
      markdown += '\n';
    });
  }

  const savePath = outputPath || path.join(analysis.projectPath, '.codebase-guru', 'report.md');
  await fs.ensureDir(path.dirname(savePath));
  await fs.writeFile(savePath, markdown);

  console.log(chalk.green(`📝 Markdown report saved to: ${savePath}`));
}

/**
 * Create default configuration file
 */
async function createDefaultConfig(configPath: string): Promise<void> {
  const defaultConfig = `module.exports = {
  // Patterns to include in analysis
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Patterns to exclude from analysis
  exclude: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    '**/*.test.*',
    '**/*.spec.*',
  ],
  
  // Framework configuration
  framework: {
    type: 'react',
    typescript: true,
    cssFramework: 'tailwind', // 'tailwind' | 'bootstrap' | 'styled-components' | 'emotion' | 'custom'
  },
  
  // Pattern detection settings
  patterns: {
    spacingGrid: 8, // Base spacing unit in pixels
    componentNaming: 'PascalCase', // 'PascalCase' | 'camelCase' | 'kebab-case'
    colorTokens: 'css-vars', // 'css-vars' | 'tailwind' | 'styled-system'
  },
  
  // Compliance thresholds
  thresholds: {
    compliance: 90, // Minimum compliance score
    maxViolations: 5, // Maximum violations before failing
  }
};
`;

  await fs.writeFile(configPath, defaultConfig);
}

/**
 * Update .gitignore file
 */
async function updateGitignore(projectPath: string): Promise<void> {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const additions = '\n# React Codebase Guru\n.codebase-guru/\n';

  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, 'utf-8');
    if (!content.includes('.codebase-guru')) {
      await fs.appendFile(gitignorePath, additions);
    }
  } else {
    await fs.writeFile(gitignorePath, additions);
  }
}