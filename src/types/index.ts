/**
 * Type definitions for React Codebase Guru
 */

export interface ComponentInfo {
  name: string;
  filePath: string;
  props?: PropInfo[];
  type: 'functional' | 'class' | 'unknown';
  hasJSX: boolean;
  dependencies?: string[];
  exports?: string[];
  styling?: StyleInfo;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface PropInfo {
  name: string;
  type?: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface StyleInfo {
  type: 'css' | 'scss' | 'sass' | 'styled-components' | 'emotion' | 'tailwind' | 'inline';
  classes?: string[];
  tokens?: string[];
  spacing?: string[];
  colors?: string[];
}

export interface CSSAnalysisResult {
  filePath: string;
  type: 'css' | 'scss' | 'sass' | 'less';
  selectors: string[];
  colors: string[];
  spacing: string[];
  fontSize: string[];
  fontWeight: string[];
  zIndex: string[];
  customProperties: Record<string, string>;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface HTMLAnalysisResult {
  filePath: string;
  elements: ElementInfo[];
  inlineStyles: InlineStyleInfo[];
  classes: string[];
  ids: string[];
  dataAttributes: string[];
  accessibility: AccessibilityInfo;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface ElementInfo {
  tagName: string;
  attributes: Record<string, string>;
  children?: ElementInfo[];
  text?: string;
}

export interface InlineStyleInfo {
  element: string;
  styles: Record<string, string>;
  line?: number;
}

export interface AccessibilityInfo {
  hasAriaLabels: boolean;
  hasAltTexts: boolean;
  missingLabels: string[];
  missingAlts: string[];
}

export interface PatternInfo {
  type: 'component' | 'style' | 'spacing' | 'color' | 'typography';
  name: string;
  occurrences: number;
  files: string[];
  confidence: number;
}

export interface DriftViolation {
  type: string;
  severity: 'error' | 'warning' | 'info';
  filePath: string;
  line?: number;
  column?: number;
  message: string;
  suggestedFix?: string;
  pattern?: string;
}

export interface ProjectAnalysis {
  projectPath: string;
  timestamp: string;
  framework: {
    type: string;
    version?: string;
    typescript: boolean;
    cssFramework?: string;
  };
  components: ComponentInfo[];
  styles: CSSAnalysisResult[];
  templates: HTMLAnalysisResult[];
  patterns: PatternInfo[];
  violations: DriftViolation[];
  compliance: {
    score: number;
    totalFiles: number;
    filesWithViolations: number;
    totalViolations: number;
  };
}

export interface AnalyzerOptions {
  projectPath: string;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
  maxFileSize?: number;
  timeout?: number;
}

export interface ErrorResult {
  success: false;
  filePath: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

export interface SkippedResult {
  success: false;
  filePath: string;
  skipped: true;
  reason: string;
  timestamp: string;
  errorType?: string;
  errorMessage?: string;
}