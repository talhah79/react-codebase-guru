/**
 * MCP Server implementation for React Codebase Guru
 * Provides real-time design consultation for AI coding agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PatternExtractor } from '../patterns/patternExtractor';
import { FileWatcher } from '../watcher/fileWatcher';
import { ConfigLoader } from '../config/configLoader';
import { ProjectAnalyzer } from '../core/projectAnalyzer';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface MCPServerOptions {
  projectPath: string;
  port?: number;
  enableRealTime?: boolean;
  maxConcurrentRequests?: number;
  enableLogging?: boolean;
  logPath?: string;
}

interface DesignGuidance {
  recommendedComponent?: string;
  styling: {
    colors: string[];
    spacing: string[];
    typography: string[];
  };
  existingPatterns: string[];
  warnings: string[];
  confidence: number;
}

interface ValidationResult {
  compliant: boolean;
  issues: Array<{
    type: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    line?: number;
    column?: number;
  }>;
  suggestions: string[];
  complianceScore: number;
  autoFixAvailable: boolean;
}

interface ComponentSuggestion {
  name: string;
  path: string;
  props: string[];
  usage: number;
  similarity: number;
  example?: string;
}

interface DesignSystemSnapshot {
  patterns: any;
  components: any[];
  compliance: number;
  recentChanges: any[];
  lastUpdated: string;
}

export class MCPServer {
  private server: Server;
  private patternExtractor: PatternExtractor;
  private projectAnalyzer: ProjectAnalyzer;
  private fileWatcher?: FileWatcher;
  private projectPath: string;
  private options: Required<MCPServerOptions>;
  private patterns: any = null;
  private lastAnalysisTime: number = 0;
  private requestCount: number = 0;
  private rateLimiter: Map<string, number[]> = new Map();

  constructor(options: MCPServerOptions) {
    this.projectPath = options.projectPath;
    this.options = {
      port: 3001,
      enableRealTime: true,
      maxConcurrentRequests: 100,
      enableLogging: true,
      logPath: path.join(options.projectPath, '.codebase-guru', 'mcp.log'),
      ...options,
    };

    // Initialize analyzers
    this.patternExtractor = new PatternExtractor();
    this.projectAnalyzer = new ProjectAnalyzer({ projectPath: this.projectPath });

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'react-codebase-guru',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.initializePatterns();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'consult_before_change',
          description: 'Get design guidance before implementing frontend changes',
          inputSchema: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                description: 'Description of intended change',
              },
              targetFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional array of files to modify',
              },
            },
            required: ['intent'],
          },
        },
        {
          name: 'validate_proposed_code',
          description: 'Validate code against design system before implementation',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to validate',
              },
              filePath: {
                type: 'string',
                description: 'Target file path',
              },
            },
            required: ['code', 'filePath'],
          },
        },
        {
          name: 'get_component_recommendations',
          description: 'Get existing component recommendations for new features',
          inputSchema: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Description of needed component functionality',
              },
            },
            required: ['description'],
          },
        },
        {
          name: 'check_style_compliance',
          description: 'Check if styles comply with design system',
          inputSchema: {
            type: 'object',
            properties: {
              styles: {
                type: 'object',
                description: 'Style object to validate',
              },
              context: {
                type: 'string',
                description: 'Optional context for the styles',
              },
            },
            required: ['styles'],
          },
        },
        {
          name: 'get_current_patterns',
          description: 'Get current design system patterns and conventions',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Optional category filter (components, colors, spacing, typography)',
              },
            },
          },
        },
        {
          name: 'analyze_drift',
          description: 'Analyze drift in specific file or entire project',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Optional specific file to analyze',
              },
              includeDetails: {
                type: 'boolean',
                description: 'Include detailed violation information',
              },
            },
          },
        },
      ],
    }));

    // Handle tool call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Rate limiting check
      if (!this.checkRateLimit(name)) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }

      this.requestCount++;
      this.log(`Processing MCP request: ${name}`, 'info');

      try {
        switch (name) {
          case 'consult_before_change':
            return await this.consultBeforeChange(args);
          
          case 'validate_proposed_code':
            return await this.validateProposedCode(args);
          
          case 'get_component_recommendations':
            return await this.getComponentRecommendations(args);
          
          case 'check_style_compliance':
            return await this.checkStyleCompliance(args);
          
          case 'get_current_patterns':
            return await this.getCurrentPatterns(args);
          
          case 'analyze_drift':
            return await this.analyzeDrift(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.log(`Error processing ${name}: ${error}`, 'error');
        throw error;
      }
    });
  }

  /**
   * Initialize patterns by analyzing the project
   */
  private async initializePatterns(): Promise<void> {
    if (this.options.enableRealTime) {
      // Set up file watcher for real-time updates
      this.fileWatcher = new FileWatcher({
        projectPath: this.projectPath,
        enableNotifications: false,
        enableDashboard: false,
        enableStreaming: false,
      });

      this.fileWatcher.on('analysis-complete', (results) => {
        this.updatePatterns(results);
      });

      await this.fileWatcher.startWatching();
    }

    // Initial pattern analysis
    await this.refreshPatterns();
  }

  /**
   * Refresh patterns by analyzing the project
   */
  private async refreshPatterns(): Promise<void> {
    const now = Date.now();
    
    // Cache patterns for 5 minutes to avoid excessive re-analysis
    if (this.patterns && now - this.lastAnalysisTime < 300000) {
      return;
    }

    this.log('Refreshing design patterns...', 'info');

    try {
      const configLoader = new ConfigLoader(this.projectPath);
      await configLoader.loadConfig();
      const analysis = await this.projectAnalyzer.analyzeProject();
      
      this.patterns = this.patternExtractor.extractPatterns(analysis);
      this.lastAnalysisTime = now;
      
      this.log(`Patterns refreshed: ${analysis.components.length} components, ${Object.keys(this.patterns).length} pattern categories`, 'info');
    } catch (error) {
      this.log(`Failed to refresh patterns: ${error}`, 'error');
      // Use cached patterns if available
      if (!this.patterns) {
        this.patterns = this.getDefaultPatterns();
      }
    }
  }

  /**
   * Update patterns from file watcher events
   */
  private updatePatterns(results: any): void {
    // Incrementally update patterns based on changes
    if (results.patterns) {
      this.patterns = { ...this.patterns, ...results.patterns };
      this.lastAnalysisTime = Date.now();
    }
  }

  /**
   * Consult before making changes
   */
  private async consultBeforeChange(args: any): Promise<any> {
    await this.refreshPatterns();

    const { intent, targetFiles } = args;
    const guidance: DesignGuidance = {
      styling: {
        colors: [],
        spacing: [],
        typography: [],
      },
      existingPatterns: [],
      warnings: [],
      confidence: 0,
    };

    // Analyze intent to understand what the user wants to do
    const intentLower = intent.toLowerCase();
    
    // Component recommendations
    if (intentLower.includes('button') || intentLower.includes('click')) {
      const buttonComponents = this.findComponentsByType('button');
      if (buttonComponents.length > 0) {
        guidance.recommendedComponent = buttonComponents[0].name;
        guidance.existingPatterns.push(`Use ${buttonComponents[0].name} component (${buttonComponents[0].usage} existing usages)`);
      }
    }

    if (intentLower.includes('card') || intentLower.includes('container')) {
      const cardComponents = this.findComponentsByType('card');
      if (cardComponents.length > 0) {
        guidance.recommendedComponent = cardComponents[0].name;
        guidance.existingPatterns.push(`Use ${cardComponents[0].name} component (${cardComponents[0].usage} existing usages)`);
      }
    }

    // Styling guidance
    if (this.patterns) {
      if (this.patterns.colors) {
        guidance.styling.colors = this.getTopPatterns(this.patterns.colors.primary, 5);
      }
      
      if (this.patterns.spacing) {
        guidance.styling.spacing = this.getTopPatterns(this.patterns.spacing.values, 5);
      }
      
      if (this.patterns.typography) {
        guidance.styling.typography = this.getTopPatterns(this.patterns.typography.fontSizes, 5);
      }
    }

    // Check target files for existing violations
    if (targetFiles && targetFiles.length > 0) {
      for (const file of targetFiles) {
        const violations = await this.checkFileViolations(file);
        if (violations.length > 0) {
          guidance.warnings.push(`File ${file} has ${violations.length} existing violations to fix`);
        }
      }
    }

    // Calculate confidence based on pattern strength
    guidance.confidence = this.calculateConfidence(guidance);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(guidance, null, 2),
        },
      ],
    };
  }

  /**
   * Validate proposed code
   */
  private async validateProposedCode(args: any): Promise<any> {
    const { code } = args;
    // filePath parameter available for future file-specific validation
    await this.refreshPatterns();

    const result: ValidationResult = {
      compliant: true,
      issues: [],
      suggestions: [],
      complianceScore: 100,
      autoFixAvailable: false,
    };

    // Check for inline styles
    if (code.includes('style=') || code.includes('style:{')) {
      result.issues.push({
        type: 'inline-styles',
        message: 'Inline styles detected. Use design system classes or styled components.',
        severity: 'warning',
      });
      result.complianceScore -= 10;
    }

    // Check for hardcoded colors
    const colorPattern = /#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/;
    if (colorPattern.test(code)) {
      result.issues.push({
        type: 'hardcoded-colors',
        message: 'Hardcoded colors detected. Use design system color tokens.',
        severity: 'warning',
      });
      result.suggestions.push('Use color tokens from your design system');
      result.complianceScore -= 15;
    }

    // Check for custom button implementations
    if (code.includes('<button') && !code.includes('<Button')) {
      const buttonComponents = this.findComponentsByType('button');
      if (buttonComponents.length > 0) {
        result.issues.push({
          type: 'component-drift',
          message: `Custom button detected. Use ${buttonComponents[0].name} component instead.`,
          severity: 'error',
        });
        result.suggestions.push(`Replace with <${buttonComponents[0].name}>`);
        result.complianceScore -= 20;
        result.autoFixAvailable = true;
      }
    }

    // Check spacing values
    const spacingPattern = /margin:\s*(\d+)px|padding:\s*(\d+)px/g;
    let match;
    while ((match = spacingPattern.exec(code)) !== null) {
      const value = parseInt(match[1] || match[2]);
      if (this.patterns?.spacing?.grid && value % this.patterns.spacing.grid !== 0) {
        result.issues.push({
          type: 'spacing-drift',
          message: `Spacing value ${value}px doesn't match ${this.patterns.spacing.grid}px grid`,
          severity: 'warning',
        });
        result.complianceScore -= 5;
      }
    }

    result.compliant = result.issues.filter(i => i.severity === 'error').length === 0;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Get component recommendations
   */
  private async getComponentRecommendations(args: any): Promise<any> {
    const { description } = args;
    await this.refreshPatterns();

    const recommendations: ComponentSuggestion[] = [];
    const descLower = description.toLowerCase();

    // Find relevant components based on description
    const analysis = await this.projectAnalyzer.analyzeProject();
    const components = analysis.components;
    
    for (const component of components) {
      let similarity = 0;
      
      // Check name similarity
      if (component.name.toLowerCase().includes(descLower) || 
          descLower.includes(component.name.toLowerCase())) {
        similarity += 50;
      }

      // Check for keyword matches
      const keywords = ['button', 'input', 'card', 'modal', 'form', 'list', 'table', 'nav'];
      for (const keyword of keywords) {
        if (descLower.includes(keyword) && component.name.toLowerCase().includes(keyword)) {
          similarity += 30;
        }
      }

      // Check prop matches
      if (component.props) {
        for (const prop of component.props) {
          if (descLower.includes(prop.name.toLowerCase())) {
            similarity += 10;
          }
        }
      }

      if (similarity > 0) {
        recommendations.push({
          name: component.name,
          path: component.filePath,
          props: component.props?.map(p => p.name) || [],
          usage: 0, // Usage tracking to be implemented
          similarity,
          example: undefined, // Examples to be implemented
        });
      }
    }

    // Sort by similarity and usage
    recommendations.sort((a, b) => {
      const scoreDiff = b.similarity - a.similarity;
      return scoreDiff !== 0 ? scoreDiff : b.usage - a.usage;
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(recommendations.slice(0, 5), null, 2),
        },
      ],
    };
  }

  /**
   * Check style compliance
   */
  private async checkStyleCompliance(args: any): Promise<any> {
    const { styles } = args;
    // context parameter available but not used currently
    await this.refreshPatterns();

    const violations = [];
    const suggestions = [];

    // Check color compliance
    if (styles.color || styles.backgroundColor || styles.borderColor) {
      const colorValue = styles.color || styles.backgroundColor || styles.borderColor;
      if (!this.isDesignSystemColor(colorValue)) {
        violations.push({
          property: 'color',
          value: colorValue,
          message: 'Use design system color tokens',
        });
        suggestions.push(`Replace ${colorValue} with a design token`);
      }
    }

    // Check spacing compliance
    const spacingProps = ['margin', 'padding', 'gap', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                         'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];
    
    for (const prop of spacingProps) {
      if (styles[prop]) {
        const value = styles[prop];
        if (typeof value === 'string' && value.endsWith('px')) {
          const numValue = parseInt(value);
          if (this.patterns?.spacing?.grid && numValue % this.patterns.spacing.grid !== 0) {
            violations.push({
              property: prop,
              value,
              message: `Use ${this.patterns.spacing.grid}px grid spacing`,
            });
            const suggested = Math.round(numValue / this.patterns.spacing.grid) * this.patterns.spacing.grid;
            suggestions.push(`Change ${prop}: ${value} to ${prop}: ${suggested}px`);
          }
        }
      }
    }

    // Check typography compliance
    if (styles.fontSize) {
      if (!this.isDesignSystemFontSize(styles.fontSize)) {
        violations.push({
          property: 'fontSize',
          value: styles.fontSize,
          message: 'Use design system font sizes',
        });
      }
    }

    const compliant = violations.length === 0;
    const score = Math.max(0, 100 - (violations.length * 15));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            compliant,
            violations,
            suggestions,
            complianceScore: score,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Get current patterns
   */
  private async getCurrentPatterns(args: any): Promise<any> {
    const { category } = args;
    await this.refreshPatterns();

    let snapshot: DesignSystemSnapshot = {
      patterns: this.patterns || {},
      components: [],
      compliance: 0,
      recentChanges: [],
      lastUpdated: new Date(this.lastAnalysisTime).toISOString(),
    };

    // Filter by category if specified
    if (category && this.patterns) {
      snapshot.patterns = { [category]: this.patterns[category] };
    }

    // Add component information
    const analysis = await this.projectAnalyzer.analyzeProject();
    snapshot.components = analysis.components.slice(0, 10).map((c: any) => ({
      name: c.name,
      path: c.filePath,
      usage: c.usage || 0,
    }));

    // Calculate compliance
    snapshot.compliance = analysis.compliance.score;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(snapshot, null, 2),
        },
      ],
    };
  }

  /**
   * Analyze drift
   */
  private async analyzeDrift(args: any): Promise<any> {
    const { includeDetails } = args;
    // filePath parameter available but not used in current implementation
    
    // Use project analyzer for drift detection
    const analysis = await this.projectAnalyzer.analyzeProject();
    const result = {
      complianceScore: analysis.compliance.score,
      violations: analysis.violations,
      summary: {
        errors: analysis.violations.filter((v: any) => v.severity === 'error').length,
        warnings: analysis.violations.filter((v: any) => v.severity === 'warning').length,
      },
    };

    const response: any = {
      complianceScore: result.complianceScore,
      violationCount: result.violations.length,
      summary: result.summary,
    };

    if (includeDetails) {
      response.violations = result.violations.slice(0, 20); // Limit to 20 violations
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Helper: Find components by type
   */
  private findComponentsByType(type: string): any[] {
    // This would be populated from the component analysis
    return this.patterns?.components?.filter((c: any) => 
      c.name.toLowerCase().includes(type.toLowerCase())
    ) || [];
  }

  /**
   * Helper: Get top patterns
   */
  private getTopPatterns(patterns: any, limit: number): string[] {
    if (!patterns) return [];
    
    if (Array.isArray(patterns)) {
      return patterns.slice(0, limit);
    }
    
    if (typeof patterns === 'object') {
      return Object.keys(patterns).slice(0, limit);
    }
    
    return [];
  }

  /**
   * Helper: Check file violations
   */
  private async checkFileViolations(_filePath: string): Promise<any[]> {
    // File-specific violations check - currently returns empty
    // This would be implemented with incremental analysis
    return [];
  }

  /**
   * Helper: Calculate confidence
   */
  private calculateConfidence(guidance: DesignGuidance): number {
    let confidence = 50; // Base confidence
    
    if (guidance.recommendedComponent) confidence += 20;
    if (guidance.styling.colors.length > 0) confidence += 10;
    if (guidance.styling.spacing.length > 0) confidence += 10;
    if (guidance.existingPatterns.length > 0) confidence += 10;
    
    return Math.min(100, confidence);
  }

  /**
   * Helper: Check if color is from design system
   */
  private isDesignSystemColor(color: string): boolean {
    if (!this.patterns?.colors) return true; // Be lenient if no patterns
    
    const designColors = [
      ...Object.values(this.patterns.colors.primary || {}),
      ...Object.values(this.patterns.colors.secondary || {}),
      ...Object.values(this.patterns.colors.neutrals || {}),
    ];
    
    return designColors.some((dc: any) => dc === color || dc.includes(color));
  }

  /**
   * Helper: Check if font size is from design system
   */
  private isDesignSystemFontSize(fontSize: string): boolean {
    if (!this.patterns?.typography?.fontSizes) return true;
    
    return this.patterns.typography.fontSizes.includes(fontSize);
  }

  /**
   * Helper: Get default patterns
   */
  private getDefaultPatterns(): any {
    return {
      spacing: { grid: 8, values: ['8px', '16px', '24px', '32px'] },
      colors: {
        primary: ['#3b82f6', '#2563eb'],
        secondary: ['#6b7280', '#4b5563'],
        neutrals: ['#ffffff', '#f3f4f6', '#e5e7eb'],
      },
      typography: {
        fontSizes: ['12px', '14px', '16px', '18px', '20px', '24px'],
      },
      components: [],
    };
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(toolName: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100; // Max 100 requests per minute per tool
    
    const key = toolName;
    const requests = this.rateLimiter.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(key, recentRequests);
    
    return true;
  }

  /**
   * Logging helper
   */
  private log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    if (!this.options.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // Write to log file
    fs.appendFileSync(this.options.logPath, logMessage);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage);
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.log(`MCP Server started on stdio transport`, 'info');
    console.log('React Codebase Guru MCP Server is running...');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (this.fileWatcher) {
      this.fileWatcher.stop();
    }
    
    this.log(`MCP Server stopped. Total requests: ${this.requestCount}`, 'info');
  }
}

// Start server if run directly
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  
  const server = new MCPServer({
    projectPath,
    enableRealTime: true,
    enableLogging: true,
  });
  
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}