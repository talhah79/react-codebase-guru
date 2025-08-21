/**
 * Markdown report generator for drift analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnalysis, DriftViolation } from '../types';
import { DriftAnalysisResult } from '../drift-detector/driftAnalyzer';
import { DesignPatterns } from '../patterns/patternExtractor';

export interface ReportOptions {
  includePatterns?: boolean;
  includeViolations?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  outputPath?: string;
}

export class MarkdownReporter {
  /**
   * Generate comprehensive markdown report
   */
  async generateReport(
    analysis: ProjectAnalysis,
    driftResult: DriftAnalysisResult,
    patterns?: DesignPatterns,
    options: ReportOptions = {}
  ): Promise<string> {
    const {
      includePatterns = true,
      includeViolations = true,
      includeSummary = true,
      includeRecommendations = true,
    } = options;

    let markdown = this.generateHeader(analysis);

    if (includeSummary) {
      markdown += this.generateSummary(analysis, driftResult);
    }

    if (includePatterns && patterns) {
      markdown += this.generatePatternsSection(patterns);
    }

    if (includeViolations) {
      markdown += this.generateViolationsSection(driftResult.violations);
    }

    if (includeRecommendations) {
      markdown += this.generateRecommendations(driftResult);
    }

    markdown += this.generateFooter();

    // Save to file if path provided
    if (options.outputPath) {
      await this.saveReport(markdown, options.outputPath);
    }

    return markdown;
  }

  /**
   * Generate report header
   */
  private generateHeader(analysis: ProjectAnalysis): string {
    const timestamp = new Date(analysis.timestamp).toLocaleString();
    
    return `# React Codebase Guru - Drift Analysis Report

📅 Generated: ${timestamp}  
📁 Project: ${analysis.projectPath}

---

`;
  }

  /**
   * Generate summary section
   */
  private generateSummary(analysis: ProjectAnalysis, driftResult: DriftAnalysisResult): string {
    const scoreEmoji = this.getScoreEmoji(driftResult.complianceScore);
    
    let markdown = `## 📊 Compliance Summary

### Overall Score: ${scoreEmoji} ${driftResult.complianceScore}%

- **Total Files Analyzed**: ${analysis.compliance.totalFiles}
- **Files with Violations**: ${analysis.compliance.filesWithViolations}
- **Total Violations**: ${driftResult.violations.length}
  - 🔴 Errors: ${driftResult.summary.errors}
  - 🟡 Warnings: ${driftResult.summary.warnings}

### Project Configuration

- **Framework**: ${analysis.framework.type}${analysis.framework.typescript ? ' (TypeScript)' : ''}
- **CSS Framework**: ${analysis.framework.cssFramework || 'Custom'}
- **Components**: ${analysis.components.length}
- **Stylesheets**: ${analysis.styles.length}
- **Templates**: ${analysis.templates.length}

`;

    // Add violation breakdown
    if (Object.keys(driftResult.summary.byType).length > 0) {
      markdown += '### Violations by Type\n\n';
      markdown += '| Type | Count |\n';
      markdown += '|------|-------|\n';
      
      for (const [type, count] of Object.entries(driftResult.summary.byType)) {
        markdown += `| ${this.formatViolationType(type)} | ${count} |\n`;
      }
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Generate patterns section
   */
  private generatePatternsSection(patterns: DesignPatterns): string {
    let markdown = `## 🎨 Detected Design Patterns

### Spacing System

- **Grid Unit**: ${patterns.spacing.unit}px
- **Confidence**: ${patterns.spacing.confidence}%
- **Common Values**: ${patterns.spacing.values.slice(0, 8).join('px, ')}px

### Color Scheme

#### Primary Colors
${patterns.colors.primary.map(c => `- \`${c}\``).join('\n') || '- None detected'}

#### Neutral Colors
${patterns.colors.neutrals.slice(0, 5).map(c => `- \`${c}\``).join('\n') || '- None detected'}

### Typography Scale

- **Font Sizes**: ${patterns.typography.fontSizes.slice(0, 6).join(', ') || 'None detected'}
- **Font Weights**: ${patterns.typography.fontWeights.join(', ') || 'None detected'}

### Component Usage

| Component | Usage Count |
|-----------|-------------|
${patterns.components.slice(0, 10).map(c => `| ${c.name} | ${c.usage} |`).join('\n')}

### Framework Detection

- **CSS Framework**: ${patterns.cssFramework || 'Custom'}
- **Naming Convention**: ${patterns.namingConvention}

`;

    return markdown;
  }

  /**
   * Generate violations section
   */
  private generateViolationsSection(violations: DriftViolation[]): string {
    if (violations.length === 0) {
      return `## ✅ No Violations Found

Excellent! Your codebase is fully compliant with the detected design patterns.

`;
    }

    let markdown = `## ⚠️ Drift Violations

`;

    // Group violations by severity
    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');
    const info = violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
      markdown += '### 🔴 Errors\n\n';
      markdown += this.formatViolations(errors);
    }

    if (warnings.length > 0) {
      markdown += '### 🟡 Warnings\n\n';
      markdown += this.formatViolations(warnings);
    }

    if (info.length > 0) {
      markdown += '### ℹ️ Information\n\n';
      markdown += this.formatViolations(info);
    }

    return markdown;
  }

  /**
   * Format violations list
   */
  private formatViolations(violations: DriftViolation[]): string {
    let markdown = '';

    // Group by file
    const byFile = new Map<string, DriftViolation[]>();
    for (const violation of violations) {
      if (!byFile.has(violation.filePath)) {
        byFile.set(violation.filePath, []);
      }
      byFile.get(violation.filePath)!.push(violation);
    }

    for (const [filePath, fileViolations] of byFile) {
      markdown += `#### 📄 \`${this.getRelativePath(filePath)}\`\n\n`;
      
      for (const violation of fileViolations) {
        markdown += `- **${this.formatViolationType(violation.type)}**: ${violation.message}\n`;
        if (violation.suggestedFix) {
          markdown += `  - 💡 **Fix**: ${violation.suggestedFix}\n`;
        }
        if (violation.line) {
          markdown += `  - 📍 Line ${violation.line}${violation.column ? `, Column ${violation.column}` : ''}\n`;
        }
        markdown += '\n';
      }
    }

    return markdown;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(driftResult: DriftAnalysisResult): string {
    let markdown = `## 💡 Recommendations

`;

    const recommendations: string[] = [];

    // Score-based recommendations
    if (driftResult.complianceScore < 50) {
      recommendations.push('🚨 **Critical**: Your compliance score is very low. Consider a comprehensive design system review.');
    } else if (driftResult.complianceScore < 70) {
      recommendations.push('⚠️ **Important**: Your compliance score needs improvement. Focus on addressing high-severity violations first.');
    } else if (driftResult.complianceScore < 90) {
      recommendations.push('📈 **Good Progress**: Your compliance is decent but has room for improvement.');
    } else {
      recommendations.push('🎉 **Excellent**: Your codebase has high design system compliance!');
    }

    // Type-specific recommendations
    const violationTypes = Object.keys(driftResult.summary.byType);

    if (violationTypes.includes('inline-styles')) {
      recommendations.push('🎨 Move inline styles to CSS classes or styled-components for better maintainability.');
    }

    if (violationTypes.includes('hardcoded-colors')) {
      recommendations.push('🎨 Use CSS variables or design tokens for colors to ensure consistency.');
    }

    if (violationTypes.includes('spacing-violation')) {
      recommendations.push('📏 Standardize spacing using a consistent grid system (e.g., 8px grid).');
    }

    if (violationTypes.includes('component-duplication')) {
      recommendations.push('🔧 Consolidate duplicate components by creating reusable variants.');
    }

    if (violationTypes.includes('accessibility')) {
      recommendations.push('♿ Improve accessibility by adding proper ARIA labels and alt texts.');
    }

    if (violationTypes.includes('naming-convention')) {
      recommendations.push('📝 Standardize component naming conventions across the codebase.');
    }

    // Add recommendations as list
    markdown += recommendations.map(r => `- ${r}`).join('\n');
    markdown += '\n\n';

    // Add quick fixes section
    if (driftResult.violations.length > 0) {
      markdown += `### 🔧 Quick Fixes

1. Run \`guru fix\` to automatically fix simple violations (coming soon)
2. Set up \`guru watch\` for real-time drift detection
3. Configure your IDE with ESLint rules for immediate feedback
4. Review and update your \`guru.config.js\` to match team standards

`;
    }

    return markdown;
  }

  /**
   * Generate report footer
   */
  private generateFooter(): string {
    return `---

*Generated by [React Codebase Guru](https://github.com/lylecodes/react-codebase-guru)*  
*Report generated at ${new Date().toISOString()}*
`;
  }

  /**
   * Save report to file
   */
  private async saveReport(markdown: string, outputPath: string): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, markdown);
  }

  /**
   * Get emoji for compliance score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }


  /**
   * Format violation type for display
   */
  private formatViolationType(type: string): string {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get relative path for display
   */
  private getRelativePath(filePath: string): string {
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      return path.relative(cwd, filePath);
    }
    return filePath;
  }

  /**
   * Generate simple text summary
   */
  generateTextSummary(driftResult: DriftAnalysisResult): string {
    const emoji = this.getScoreEmoji(driftResult.complianceScore);
    
    let summary = `
${emoji} Compliance Score: ${driftResult.complianceScore}%
📊 Total Violations: ${driftResult.violations.length}
   🔴 Errors: ${driftResult.summary.errors}
   🟡 Warnings: ${driftResult.summary.warnings}
`;

    if (Object.keys(driftResult.summary.byType).length > 0) {
      summary += '\nViolation Types:\n';
      for (const [type, count] of Object.entries(driftResult.summary.byType)) {
        summary += `   • ${this.formatViolationType(type)}: ${count}\n`;
      }
    }

    return summary;
  }
}