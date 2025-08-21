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
 * Watch command - real-time monitoring (placeholder)
 */
program
  .command('watch')
  .description('Start real-time drift detection')
  .option('-p, --path <path>', 'Project path to watch', process.cwd())
  .action(async () => {
    console.log(chalk.cyan('\n👁️  Watch mode coming soon!\n'));
    console.log(chalk.gray('This feature will be implemented in Phase 2'));
  });

/**
 * Report command - generate drift report (placeholder)
 */
program
  .command('report')
  .description('Generate detailed drift report')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async () => {
    console.log(chalk.cyan('\n📊 Report generation coming soon!\n'));
    console.log(chalk.gray('This feature will be implemented in Milestone 1.3'));
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