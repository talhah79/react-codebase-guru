/**
 * Configuration loader and validator
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as Joi from 'joi';

export interface GuruConfig {
  include?: string[];
  exclude?: string[];
  framework?: {
    type?: string;
    typescript?: boolean;
    cssFramework?: string;
  };
  patterns?: {
    spacingGrid?: number;
    componentNaming?: 'PascalCase' | 'camelCase' | 'kebab-case';
    colorTokens?: 'css-vars' | 'tailwind' | 'styled-system';
  };
  thresholds?: {
    compliance?: number;
    maxViolations?: number;
  };
  rules?: {
    [key: string]: 'error' | 'warning' | 'off';
  };
  version?: string;
}

const configSchema = Joi.object({
  include: Joi.array().items(Joi.string()),
  exclude: Joi.array().items(Joi.string()),
  framework: Joi.object({
    type: Joi.string().valid('react', 'next', 'gatsby', 'remix'),
    typescript: Joi.boolean(),
    cssFramework: Joi.string().valid('tailwind', 'bootstrap', 'styled-components', 'emotion', 'custom'),
  }),
  patterns: Joi.object({
    spacingGrid: Joi.number().positive(),
    componentNaming: Joi.string().valid('PascalCase', 'camelCase', 'kebab-case'),
    colorTokens: Joi.string().valid('css-vars', 'tailwind', 'styled-system'),
  }),
  thresholds: Joi.object({
    compliance: Joi.number().min(0).max(100),
    maxViolations: Joi.number().min(0),
  }),
  rules: Joi.object().pattern(
    Joi.string(),
    Joi.string().valid('error', 'warning', 'off')
  ),
  version: Joi.string(),
}).unknown(false);

export class ConfigLoader {
  private projectPath: string;
  private configCache: GuruConfig | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Load configuration from guru.config.js
   */
  async loadConfig(): Promise<GuruConfig> {
    // Check cache first
    if (this.configCache) {
      return this.configCache;
    }

    const configPath = path.join(this.projectPath, 'guru.config.js');
    
    try {
      if (await fs.pathExists(configPath)) {
        // Clear require cache to get fresh config
        delete require.cache[require.resolve(configPath)];
        
        const userConfig = require(configPath);
        
        // Validate config
        const { error, value } = configSchema.validate(userConfig);
        if (error) {
          console.warn(`Config validation warning: ${error.details[0].message}`);
          console.warn('Using default configuration');
          return this.getDefaultConfig();
        }
        
        // Merge with defaults
        const config = this.mergeWithDefaults(value);
        this.configCache = config;
        return config;
      }
    } catch (error) {
      console.warn(`Failed to load config: ${error instanceof Error ? error.message : error}`);
    }

    // Return default config
    const defaultConfig = this.getDefaultConfig();
    this.configCache = defaultConfig;
    return defaultConfig;
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): GuruConfig {
    return {
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'pages/**/*.{js,jsx,ts,tsx}',
        'app/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'node_modules',
        'dist',
        'build',
        '.git',
        'coverage',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.d.ts',
      ],
      framework: {
        type: 'react',
        typescript: false,
        cssFramework: 'custom',
      },
      patterns: {
        spacingGrid: 8,
        componentNaming: 'PascalCase',
        colorTokens: 'css-vars',
      },
      thresholds: {
        compliance: 90,
        maxViolations: 10,
      },
      rules: {
        'inline-styles': 'warning',
        'hardcoded-colors': 'warning',
        'component-duplication': 'error',
        'spacing-violation': 'warning',
        'accessibility': 'error',
        'naming-convention': 'warning',
      },
      version: '1.0.0',
    };
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: Partial<GuruConfig>): GuruConfig {
    const defaults = this.getDefaultConfig();
    
    return {
      include: userConfig.include || defaults.include,
      exclude: userConfig.exclude || defaults.exclude,
      framework: {
        ...defaults.framework,
        ...userConfig.framework,
      },
      patterns: {
        ...defaults.patterns,
        ...userConfig.patterns,
      },
      thresholds: {
        ...defaults.thresholds,
        ...userConfig.thresholds,
      },
      rules: {
        ...defaults.rules,
        ...userConfig.rules,
      },
      version: userConfig.version || defaults.version,
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: GuruConfig): Promise<void> {
    const configPath = path.join(this.projectPath, 'guru.config.js');
    
    const configContent = `module.exports = ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")};`;
    
    await fs.writeFile(configPath, configContent);
    this.configCache = config;
  }

  /**
   * Validate configuration
   */
  validateConfig(config: unknown): { valid: boolean; errors?: string[] } {
    const { error } = configSchema.validate(config);
    
    if (error) {
      return {
        valid: false,
        errors: error.details.map(d => d.message),
      };
    }
    
    return { valid: true };
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache = null;
  }

  /**
   * Watch configuration file for changes
   */
  async watchConfig(callback: (config: GuruConfig) => void): Promise<() => void> {
    const configPath = path.join(this.projectPath, 'guru.config.js');
    
    if (!(await fs.pathExists(configPath))) {
      return () => {};
    }

    const chokidar = await import('chokidar');
    const watcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async () => {
      this.clearCache();
      const newConfig = await this.loadConfig();
      callback(newConfig);
    });

    // Return cleanup function
    return () => {
      watcher.close();
    };
  }

  /**
   * Get rule severity
   */
  getRuleSeverity(ruleName: string): 'error' | 'warning' | 'off' {
    const config = this.configCache || this.getDefaultConfig();
    return config.rules?.[ruleName] || 'warning';
  }

  /**
   * Check if rule is enabled
   */
  isRuleEnabled(ruleName: string): boolean {
    return this.getRuleSeverity(ruleName) !== 'off';
  }

  /**
   * Generate example configuration
   */
  static generateExampleConfig(): string {
    return `module.exports = {
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
    type: 'react', // 'react' | 'next' | 'gatsby' | 'remix'
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
    compliance: 90, // Minimum compliance score (0-100)
    maxViolations: 10, // Maximum violations before failing
  },
  
  // Rule severities
  rules: {
    'inline-styles': 'warning',
    'hardcoded-colors': 'warning',
    'component-duplication': 'error',
    'spacing-violation': 'warning',
    'accessibility': 'error',
    'naming-convention': 'warning',
  }
};
`;
  }
}