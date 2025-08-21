## Go-to-Market Strategy

### Target Personas

#### Primary: Solo Developers & Freelancers
- **Profile**: Full-stack developers using AI coding tools
- **Pain Points**: Constant design system reminders to AI agents
- **Budget**: $10-25/month for productivity tools
- **Channels**: Twitter/X, Reddit (r/webdev, r/reactjs), GitHub

#### Secondary: Small Development Teams (2-10 developers)
- **Profile**: Startups, agencies, small product teams
- **Pain Points**: Design consistency across team members and AI tools
- **Budget**: $50-200/month for team tools
- **Channels**: Indie Hackers, dev conferences, team lead networks

#### Tertiary: Enterprise Development Teams
- **Profile**: Large companies with established design systems
- **Pain Points**: Governance, compliance, onboarding new developers
- **Budget**: $500-2000/month for enterprise tools
- **Channels**: Sales outreach, enterprise dev communities, compliance officers

### Distribution Channels

#### Organic Growth
- **GitHub**: Open source community edition
- **NPM**: Easy installation and discovery
- **Dev Twitter/X**: Share drift detection examples and wins
- **Reddit**: r/webdev, r/reactjs, r/Frontend community engagement
- **Dev.to/Medium**: Technical content about design system drift

#### Content Marketing
- **"I built this because..."**: Personal story of AI coding frustration
- **Before/after demos**: Show drift detection in action
- **Design system case studies**: How teams prevent drift
- **AI coding best practices**: Position as essential AI tool

#### Partnership Opportunities
- **Storybook**: Integration with component documentation
- **Design system tools**: Partner with Figma plugin developers
- **AI coding platforms**: Official integrations with Cursor, Claude Desktop
- **Design agencies**: White-label offerings for client projects

### Launch Strategy

#### Phase 1: Developer Community (Months 1-2)
- Launch free version on GitHub
- Post on Reddit/Twitter with demo videos
- Create content about AI coding consistency problems
- Build initial user base and gather feedback

#### Phase 2: Premium Launch (Month 3)
- Launch paid tiers with real-time detection
- Target early adopters who love the free version
- Add MCP integrations for popular AI tools
- Focus on individual developer conversions

#### Phase 3: Team Features (Months 4-6)
- Roll out collaboration features
- Target small teams and agencies
- Add integrations (Slack, GitHub Actions)
- Develop case studies and testimonials

#### Phase 4: Enterprise (Months 6-12)
- Enterprise features and security
- Sales outreach to larger companies
- Partnership discussions with design system vendors
- Industry conference presence

### Technical Metrics
- **Drift Reduction**: Decrease in design system violations over time
- **Prevention Rate**: Inconsistencies caught before merge vs after
- **Compliance Score**: Percentage adherence to established patterns  
- **Context Efficiency**: Reduction in AI context pollution
- **Developer Velocity**: Time saved on consistency corrections

## Success Metrics

### Technical Metrics
- **Drift Reduction**: Decrease in design system violations over time
- **Prevention Rate**: Inconsistencies caught before merge vs after
- **Compliance Score**: Percentage adherence to established patterns  
- **Context Efficiency**: Reduction in AI context pollution
- **Developer Velocity**: Time saved on consistency corrections

## Future Enhancements
- **Multi-framework support** (Vue, Angular, Svelte)
- **Visual diff reports** showing before/after comparisons
- **Design tool integration** (Figma, Sketch) for pattern sync
- **Backend pattern detection** (API consistency, database schema)
- **Cross-platform mobile** (React Native drift detection)
- **AI-powered suggestions** for pattern improvements
- **Design system marketplace** for sharing patterns
- **Browser extension** for real-time web app analysis

## User Onboarding Strategy

### First-Time User Experience

#### Initial Setup Flow
```bash
# User installs globally
npm install -g react-codebase-guru

# User navigates to their React project
cd my-react-project

# Initialization wizard starts
guru init
```

#### Interactive Setup Wizard
```
🎯 Welcome to React Codebase Guru!

Let's analyze your project and set up intelligent codebase monitoring.

✨ Step 1: Project Detection
   ✅ React project detected
   ✅ TypeScript found
   ✅ Tailwind CSS detected
   ✅ 47 components found

✨ Step 2: Framework Configuration
   📁 Component directory: src/components/ ✅
   🎨 CSS framework: Tailwind CSS ✅
   📝 Naming convention: PascalCase ✅

✨ Step 3: Pattern Learning
   🔍 Analyzing your design system...
   📊 Found Button component (12 variants, 23 usages)
   📊 Found Card component (3 variants, 15 usages)
   📊 Detected 8px spacing grid (89% compliance)
   📊 Found primary color: blue-500 (consistent usage)

✨ Step 4: Initial Health Check
   🟢 Design system compliance: 87%
   🟡 Found 5 potential improvements
   🔴 Found 2 drift violations

Would you like to see the detailed report? (y/N)
```

#### Guided First Analysis
```
📋 Your Project Health Report

🎯 Overall Score: 87% (Good)

✅ Strengths:
  • Consistent component usage
  • Good spacing system adherence
  • Color token consistency

⚠️  Areas for Improvement:
  • 3 custom buttons found (should use Button component)
  • 2 inline style violations
  • 1 spacing inconsistency

🔧 Quick Fixes Available:
  Run `guru fix` to automatically resolve 4 of these issues.

📚 Next Steps:
  1. Run `guru watch` to monitor real-time changes
  2. Set up MCP integration for AI coding assistance
  3. Configure team notifications (optional)

Ready to start monitoring? Run `guru watch`
```

### Onboarding Sequence

#### Phase 1: Discovery (First 5 minutes)
**Goal**: User understands their project's current state

**Experience Flow:**
1. **Installation confirmation** - "guru --version" shows success
2. **Project analysis** - Automatic detection of framework and patterns
3. **Health score reveal** - Immediate value with current compliance score
4. **Quick wins identification** - Show easy improvements available

**Success Metrics:**
- User completes `guru init` successfully
- User sees their compliance score
- User understands top 3 improvement opportunities

#### Phase 2: Value Demonstration (First 15 minutes)
**Goal**: User experiences immediate value from the tool

**Experience Flow:**
1. **Run first scan** - `guru scan` shows detailed violations
2. **Watch mode demo** - `guru watch` catches real-time changes
3. **Fix suggestions** - Clear, actionable recommendations
4. **Before/after comparison** - Show improvement after fixes

**Success Metrics:**
- User runs their first scan
- User fixes at least 1 violation
- User sees compliance score improve

#### Phase 3: Habit Formation (First week)
**Goal**: User integrates tool into daily workflow

**Experience Flow:**
1. **Daily reminders** - Gentle prompts to check project health
2. **Weekly reports** - Progress tracking and trend analysis
3. **Team integration** - Optional team features introduction
4. **Advanced features** - MCP integration walkthrough

**Success Metrics:**
- User runs guru commands 3+ times in first week
- User sets up watch mode or MCP integration
- User compliance score improves by 10%+

### User Journey Templates

#### Solo Developer Journey
```
Day 1: "Wow, I didn't realize I had so many inconsistencies"
├── Install and run guru init
├── See 15% of buttons are custom (should use Button component)
├── Fix 3 violations in 10 minutes
└── Set up guru watch for real-time monitoring

Day 3: "This is catching issues I would have missed"
├── Guru alerts about new inline style
├── Quick fix suggestion prevents drift
└── Compliance score improves to 92%

Week 1: "I can't code without this now"
├── Set up MCP integration with AI coding assistant
├── AI agents now consult guru before changes
└── Zero drift violations introduced this week
```

#### Team Lead Journey
```
Day 1: "This could solve our design system consistency problems"
├── Run guru init on main project
├── Share initial report with team (73% compliance)
├── Identify top 5 patterns to standardize
└── Set up Slack notifications for violations

Week 1: "Team is actually following design system now"
├── Set up guru in CI/CD pipeline
├── All PRs must pass guru compliance check
├── Team compliance improved from 73% to 89%
└── New developers onboard faster with guru guidance

Month 1: "This is essential infrastructure now"
├── Rolled out to 3 additional projects
├── Team patterns library established
├── Design system governance automated
└── Reduced design review time by 60%
```

### Onboarding Content Strategy

#### Getting Started Guide
**Sections:**
1. **Quick Start** (5 min) - Install, init, first scan
2. **Understanding Your Score** (5 min) - How compliance is calculated
3. **Common Fixes** (10 min) - Top 5 violations and solutions
4. **Watch Mode Setup** (5 min) - Real-time monitoring
5. **AI Integration** (10 min) - MCP setup with coding assistants

#### Interactive Tutorials
**Built into CLI:**
```bash
guru tutorial basics      # Basic drift detection
guru tutorial watch       # Real-time monitoring  
guru tutorial mcp         # AI agent integration
guru tutorial team        # Team collaboration
guru tutorial advanced    # Custom rules and config
```

#### Example Projects
**Starter Templates:**
- `guru example basic` - Simple React project with common violations
- `guru example tailwind` - Tailwind CSS project setup
- `guru example enterprise` - Large-scale project configuration

### Onboarding Metrics & Optimization

#### Key Metrics to Track
**Activation Metrics:**
- % users who complete `guru init`
- % users who run first scan
- % users who fix at least 1 violation
- Time to first value (seeing compliance score)

**Engagement Metrics:**
- % users who return within 24 hours
- % users who set up watch mode
- % users who integrate with AI tools
- Average commands per user in first week

**Success Metrics:**
- % users with improved compliance scores
- % users still active after 1 week
- % users who upgrade to premium features

#### A/B Testing Opportunities
**Setup Flow Variations:**
- Immediate scan vs. guided configuration first
- Detailed explanations vs. quick overview
- Auto-fix suggestions vs. manual guidance

**Value Demonstration:**
- Compliance score prominence
- Violation examples vs. abstract metrics
- Before/after comparisons timing

### Support & Help System

#### In-App Help
```bash
guru help                 # General help
guru help scan            # Command-specific help
guru explain score        # Compliance score breakdown
guru explain violations   # Violation types explained
guru troubleshoot         # Common issues and solutions
```

#### Contextual Guidance
**Smart Suggestions:**
- Low compliance score → Suggest `guru fix`
- Many violations → Recommend watch mode
- Large project → Suggest team features
- Consistent usage → Promote MCP integration

#### Community Resources
**Documentation Hub:**
- Getting started videos
- Best practices guide
- Common patterns library
- Troubleshooting FAQ
- Community examples

**User Support:**
- Discord community for questions
- GitHub issues for bug reports
- Email support for premium users
- Office hours for enterprise customers

### Onboarding Implementation Checklist

#### CLI Onboarding Features
- [ ] Interactive setup wizard (`guru init`)
- [ ] Project health scoring and explanation
- [ ] Built-in tutorials (`guru tutorial`)
- [ ] Contextual help system
- [ ] Progress tracking and celebration

#### Content Creation
- [ ] Getting started video (< 5 minutes)
- [ ] Written quick start guide
- [ ] Common violations explanation
- [ ] Example project templates
- [ ] Best practices documentation

#### User Experience Testing
- [ ] Time new users to first value
- [ ] A/B test setup flow variations
- [ ] User interview feedback sessions
- [ ] Support ticket analysis
- [ ] Community feedback integration

#### Success Measurement
- [ ] Analytics for onboarding funnel
- [ ] User activation rate tracking
- [ ] Feature adoption measurement
- [ ] Long-term retention analysis
- [ ] Compliance score improvement tracking
- **Multi-framework support** (Vue, Angular, Svelte)
- **Visual diff reports** showing before/after comparisons
- **Design tool integration** (Figma, Sketch) for pattern sync
- **Backend pattern detection** (API consistency, database schema)
- **Cross-platform mobile** (React Native drift detection)
- **AI-powered suggestions** for pattern improvements
- **Design system marketplace** for sharing patterns
- **Browser extension** for real-time web app analysis# React Codebase Guru - High Level Design

## Overview
A CLI tool and MCP server that detects and prevents design system drift in React projects. Acts as a real-time drift detector and codebase consultant, learning your project's UI patterns and catching inconsistencies before they accumulate.

## Problem Statement
**Design System Drift**: Codebases gradually drift away from established patterns as:
- Developers forget existing components and create custom variations
- AI coding agents generate inconsistent implementations
- New team members don't know established conventions
- Design system updates aren't consistently applied

**Current Pain Points:**
- Constant manual reminders to coding agents about design patterns
- Inconsistent component usage across the codebase  
- AI context pollution with repetitive design system instructions
- Time-consuming manual audits to catch drift

## Core Architecture

### 1. CLI Interface (using `commander.js`)
```

### 8. Error Handling & Edge Cases

#### Robust File Parsing
```javascript
// src/analyzers/errorHandler.js
class AnalysisErrorHandler {
  async safeParseFile(filePath, parser) {
    try {
      const stats = await fs.stat(filePath);
      
      // Skip files that are too large (>5MB)
      if (stats.size > 5 * 1024 * 1024) {
        return this.createSkippedResult(filePath, 'File too large');
      }
      
      // Check file encoding
      if (!this.isValidEncoding(filePath)) {
        return this.createSkippedResult(filePath, 'Invalid encoding');
      }
      
      return await parser.parse(filePath);
      
    } catch (error) {
      return this.handleParsingError(filePath, error);
    }
  }
  
  handleParsingError(filePath, error) {
    const errorTypes = {
      'SyntaxError': 'syntax-error',
      'ENOENT': 'file-not-found',
      'EACCES': 'permission-denied',
      'EMFILE': 'too-many-files'
    };
    
    const errorType = errorTypes[error.code] || errorTypes[error.constructor.name] || 'unknown';
    
    console.warn(`⚠️  Failed to parse ${filePath}: ${error.message}`);
    
    return {
      filePath,
      success: false,
      errorType,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  createSkippedResult(filePath, reason) {
    return {
      filePath,
      success: false,
      skipped: true,
      reason,
      timestamp: new Date().toISOString()
    };
  }
}

// Memory management for large projects
class MemoryManager {
  constructor(maxMemoryMB = 512) {
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.cache = new Map();
    this.cacheSize = 0;
  }
  
  addToCache(key, data) {
    const size = this.calculateSize(data);
    
    if (this.cacheSize + size > this.maxMemory) {
      this.evictOldestEntries(size);
    }
    
    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.cacheSize += size;
  }
  
  evictOldestEntries(neededSize) {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    let freedSize = 0;
    for (const [key, value] of entries) {
      this.cache.delete(key);
      this.cacheSize -= value.size;
      freedSize += value.size;
      
      if (freedSize >= neededSize) break;
    }
  }
}
```

### 9. Performance Optimizations

#### Incremental Analysis Engine
```javascript
// src/performance/incrementalAnalyzer.js
class IncrementalAnalyzer {
  constructor() {
    this.fileHashes = new Map();
    this.analysisCache = new Map();
    this.dependencyGraph = new Map();
  }
  
  async analyzeChangedFiles(changedPaths) {
    const results = [];
    
    for (const filePath of changedPaths) {
      const currentHash = await this.calculateFileHash(filePath);
      const previousHash = this.fileHashes.get(filePath);
      
      if (currentHash !== previousHash) {
        // File actually changed, re-analyze
        const result = await this.analyzeFile(filePath);
        results.push(result);
        
        // Update hash and cache
        this.fileHashes.set(filePath, currentHash);
        this.analysisCache.set(filePath, result);
        
        // Invalidate dependent files
        await this.invalidateDependents(filePath);
      } else {
        // Use cached result
        const cached = this.analysisCache.get(filePath);
        if (cached) results.push(cached);
      }
    }
    
    return results;
  }
  
  async calculateFileHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  buildDependencyGraph(files) {
    files.forEach(file => {
      if (file.dependencies) {
        file.dependencies.forEach(dep => {
          if (!this.dependencyGraph.has(dep)) {
            this.dependencyGraph.set(dep, new Set());
          }
          this.dependencyGraph.get(dep).add(file.filePath);
        });
      }
    });
  }
}

// Batch processing for large projects
class BatchProcessor {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.queue = [];
    this.active = 0;
  }
  
  async processFiles(files, processor) {
    return new Promise((resolve) => {
      const results = [];
      let completed = 0;
      
      const processNext = async () => {
        if (this.active >= this.concurrency || this.queue.length === 0) {
          return;
        }
        
        this.active++;
        const file = this.queue.shift();
        
        try {
          const result = await processor(file);
          results[file.index] = result;
        } catch (error) {
          results[file.index] = { error: error.message, filePath: file.path };
        }
        
        this.active--;
        completed++;
        
        if (completed === files.length) {
          resolve(results);
        } else {
          processNext();
        }
      };
      
      // Add files to queue with index
      files.forEach((file, index) => {
        this.queue.push({ ...file, index });
      });
      
      // Start processing
      for (let i = 0; i < this.concurrency; i++) {
        processNext();
      }
    });
  }
}
```

### 10. Testing Strategy

#### Test Structure & Framework
```javascript
// tests/setup.js
const fs = require('fs-extra');
const path = require('path');

class TestFileSystem {
  constructor() {
    this.tempDir = path.join(__dirname, '.temp-test-projects');
  }
  
  async createTestProject(name, structure) {
    const projectPath = path.join(this.tempDir, name);
    await fs.ensureDir(projectPath);
    
    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }
    
    return projectPath;
  }
  
  async cleanup() {
    await fs.remove(this.tempDir);
  }
}

// tests/unit/componentAnalyzer.test.js
describe('ComponentAnalyzer', () => {
  let analyzer;
  let testFS;
  
  beforeEach(async () => {
    analyzer = new ComponentAnalyzer();
    testFS = new TestFileSystem();
  });
  
  afterEach(async () => {
    await testFS.cleanup();
  });
  
  test('should parse TypeScript React component', async () => {
    const projectPath = await testFS.createTestProject('test-ts', {
      'src/Button.tsx': `
        interface ButtonProps {
          variant: 'primary' | 'secondary';
          size?: 'sm' | 'md' | 'lg';
          onClick: () => void;
        }
        
        export const Button: React.FC<ButtonProps> = ({ variant, size = 'md', onClick }) => {
          return <button className={\`btn btn-\${variant} btn-\${size}\`} onClick={onClick} />;
        };
      `
    });
    
    const result = await analyzer.parseReactComponent(path.join(projectPath, 'src/Button.tsx'));
    
    expect(result.displayName).toBe('Button');
    expect(result.props).toHaveLength(3);
    expect(result.props.find(p => p.name === 'variant')).toMatchObject({
      name: 'variant',
      type: 'enum',
      required: true
    });
  });
  
  test('should handle malformed components gracefully', async () => {
    const projectPath = await testFS.createTestProject('test-malformed', {
      'src/Broken.tsx': `
        export const Broken = () => {
          return <div>Missing closing brace
      `
    });
    
    const result = await analyzer.parseReactComponent(path.join(projectPath, 'src/Broken.tsx'));
    
    expect(result.success).toBe(false);
    expect(result.errorType).toBe('syntax-error');
  });
});

// tests/integration/driftDetection.test.js
describe('Drift Detection Integration', () => {
  test('should detect component drift in real project', async () => {
    const projectStructure = {
      'src/components/Button.tsx': '/* existing Button component */',
      'src/pages/Login.tsx': `
        export const Login = () => {
          return (
            <div>
              <button style={{backgroundColor: 'red', padding: '10px'}}>
                Custom Button
              </button>
            </div>
          );
        };
      `
    };
    
    const projectPath = await testFS.createTestProject('drift-test', projectStructure);
    const detector = new DriftDetector(projectPath);
    
    const results = await detector.analyzeProject();
    
    expect(results.violations).toHaveLength(2);
    expect(results.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'component-duplication' }),
        expect.objectContaining({ type: 'inline-styles' })
      ])
    );
  });
});

// tests/performance/benchmarks.test.js
describe('Performance Benchmarks', () => {
  test('should analyze 1000 files under 30 seconds', async () => {
    const largeProject = generateLargeProject(1000);
    const startTime = Date.now();
    
    const detector = new DriftDetector(largeProject);
    await detector.analyzeProject();
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
  
  test('should use incremental analysis for file changes', async () => {
    const project = await createTestProject();
    const detector = new DriftDetector(project);
    
    // Initial analysis
    const startTime1 = Date.now();
    await detector.analyzeProject();
    const fullAnalysisTime = Date.now() - startTime1;
    
    // Change one file
    await modifyFile(path.join(project, 'src/Button.tsx'));
    
    const startTime2 = Date.now();
    await detector.analyzeChangedFiles(['src/Button.tsx']);
    const incrementalTime = Date.now() - startTime2;
    
    expect(incrementalTime).toBeLessThan(fullAnalysisTime * 0.1); // 90% faster
  });
});
```

### 11. Deployment & Distribution

#### NPM Package Structure
```json
{
  "name": "react-codebase-guru",
  "version": "1.0.0",
  "description": "Real-time design system drift detection and codebase consultation for React projects",
  "main": "dist/index.js",
  "bin": {
    "guru": "dist/cli/index.js",
    "react-codebase-guru": "dist/cli/index.js"
  },
  "files": [
    "dist/",
    "templates/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.js",
    "prepublishOnly": "npm run build && npm test",
    "postinstall": "node dist/setup/postinstall.js"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "os": ["darwin", "linux", "win32"],
  "cpu": ["x64", "arm64"]
}
```

#### Build Configuration
```javascript
// rollup.config.js
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm'
    }
  ],
  external: ['fs', 'path', 'crypto', 'os'],
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    babel({ exclude: 'node_modules/**' }),
    terser()
  ]
};

// Docker support
// Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/mcp/server.js"]
```

#### Auto-update Mechanism
```javascript
// src/update/updater.js
class AutoUpdater {
  constructor() {
    this.updateCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.lastCheckFile = path.join(os.homedir(), '.drift-detect-last-check');
  }
  
  async checkForUpdates() {
    try {
      const response = await fetch('https://registry.npmjs.org/react-drift-detector/latest');
      const data = await response.json();
      const latestVersion = data.version;
      const currentVersion = require('../../package.json').version;
      
      if (semver.gt(latestVersion, currentVersion)) {
        console.log(`📦 Update available: ${currentVersion} → ${latestVersion}`);
        console.log('Run: npm update -g react-drift-detector');
        return { updateAvailable: true, latestVersion };
      }
    } catch (error) {
      // Fail silently for update checks
    }
    
    return { updateAvailable: false };
  }
  
  async shouldCheckForUpdates() {
    try {
      const lastCheck = await fs.readFile(this.lastCheckFile, 'utf8');
      const lastCheckTime = new Date(lastCheck);
      return Date.now() - lastCheckTime.getTime() > this.updateCheckInterval;
    } catch {
      return true; // First run
    }
  }
}
```

### 12. Configuration Management

#### Config Validation & Migration
```javascript
// src/config/validator.js
const Joi = require('joi');

const configSchema = Joi.object({
  include: Joi.array().items(Joi.string()).required(),
  exclude: Joi.array().items(Joi.string()).default([]),
  framework: Joi.object({
    type: Joi.string().valid('react', 'vue', 'angular').required(),
    typescript: Joi.boolean().default(false),
    cssFramework: Joi.string().valid('tailwind', 'bootstrap', 'custom').default('custom')
  }).required(),
  patterns: Joi.object({
    spacingGrid: Joi.number().positive().default(8),
    colorTokens: Joi.string().valid('css-vars', 'tailwind', 'styled-system').default('css-vars'),
    componentNaming: Joi.string().valid('PascalCase', 'camelCase', 'kebab-case').default('PascalCase')
  }),
  thresholds: Joi.object({
    compliance: Joi.number().min(0).max(100).default(90),
    maxViolations: Joi.number().min(0).default(5)
  }),
  version: Joi.string().default('1.0.0')
});

class ConfigManager {
  constructor(projectPath) {
    this.configPath = path.join(projectPath, 'guru.config.js');
    this.migrations = new Map([
      ['0.9.0', this.migrateFrom090],
      ['1.0.0', this.migrateFrom100]
    ]);
  }
  
  async loadConfig() {
    try {
      delete require.cache[this.configPath];
      const userConfig = require(this.configPath);
      
      // Validate config
      const { error, value } = configSchema.validate(userConfig);
      if (error) {
        throw new Error(`Config validation failed: ${error.details[0].message}`);
      }
      
      // Check if migration needed
      const currentVersion = require('../../package.json').version;
      if (value.version !== currentVersion) {
        return await this.migrateConfig(value);
      }
      
      return value;
    } catch (error) {
      console.warn('Using default configuration');
      return this.getDefaultConfig();
    }
  }
  
  async migrateConfig(oldConfig) {
    let config = { ...oldConfig };
    
    for (const [version, migrator] of this.migrations) {
      if (semver.gt(version, config.version)) {
        config = await migrator(config);
        config.version = version;
      }
    }
    
    // Save migrated config
    await this.saveConfig(config);
    return config;
  }
}

// Environment variable support
class EnvironmentConfig {
  static override(config) {
    return {
      ...config,
      mcp: {
        ...config.mcp,
        port: process.env.DRIFT_DETECT_PORT || config.mcp?.port || 3001,
        enabled: process.env.DRIFT_DETECT_MCP_ENABLED === 'true' || config.mcp?.enabled
      },
      notifications: {
        ...config.notifications,
        slack: {
          ...config.notifications?.slack,
          webhook: process.env.SLACK_WEBHOOK || config.notifications?.slack?.webhook
        }
      }
    };
  }
}
```

### 13. Security Considerations

#### Security Implementation
```javascript
// src/security/validator.js
class SecurityValidator {
  constructor() {
    this.allowedFileExtensions = new Set([
      '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.html', '.htm'
    ]);
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxPathLength = 4096;
  }
  
  validateFilePath(filePath) {
    // Prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(process.cwd())) {
      throw new Error('File path outside project directory');
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!this.allowedFileExtensions.has(ext)) {
      throw new Error(`File extension ${ext} not allowed`);
    }
    
    // Check path length
    if (filePath.length > this.maxPathLength) {
      throw new Error('File path too long');
    }
    
    return true;
  }
  
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      throw new Error('Input must be string');
    }
    
    // Remove potential script injection
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// MCP Server Authentication
class MCPAuthenticator {
  constructor() {
    this.allowedOrigins = new Set([
      'claude-desktop',
      'cursor', 
      'vscode',
      'localhost'
    ]);
    this.rateLimiter = new Map();
  }
  
  authenticate(origin, clientId) {
    // Validate origin
    if (!this.allowedOrigins.has(origin)) {
      throw new Error(`Origin ${origin} not allowed`);
    }
    
    // Rate limiting
    const now = Date.now();
    const clientRequests = this.rateLimiter.get(clientId) || [];
    
    // Remove old requests (older than 1 minute)
    const recentRequests = clientRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length > 100) { // Max 100 requests per minute
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(clientId, recentRequests);
    
    return true;
  }
}

// Dependency vulnerability scanning
class VulnerabilityScanner {
  async scanDependencies() {
    try {
      const { stdout } = await exec('npm audit --json');
      const auditResult = JSON.parse(stdout);
      
      if (auditResult.metadata.vulnerabilities.total > 0) {
        console.warn('⚠️  Security vulnerabilities detected in dependencies');
        console.warn('Run: npm audit fix');
      }
      
      return auditResult;
    } catch (error) {
      console.warn('Could not run security audit');
      return null;
    }
  }
}
```bash
# Installation
npm install -g react-codebase-guru

# Commands
guru init                         # Initialize project monitoring
guru scan                         # Manual drift analysis
guru watch                        # Real-time drift detection
guru report                       # Generate drift report
guru plan "add user button"       # Generate drift-aware feature plan
```

### 2. Code Analysis Engine

#### Component Parsing (leverage existing tools)
- **react-docgen**: Parse JavaScript/Flow React components
- **react-docgen-typescript**: Parse TypeScript React components  
- **postcss**: Parse CSS files and extract styling patterns
- **css-tree**: Fast CSS AST parsing for style analysis
- **node-html-parser**: Parse HTML templates and extract patterns
- **glob**: Find React component, CSS, and HTML files

#### Component, Style & HTML Detection
```javascript
const reactDocgen = require('react-docgen');
const reactDocgenTs = require('react-docgen-typescript');
const postcss = require('postcss');
const csstree = require('css-tree');
const { parse: parseHTML } = require('node-html-parser');

// For TypeScript components
const tsParser = reactDocgenTs.withDefaultConfig();
const componentInfo = tsParser.parse('./src/components/Button.tsx');

// For CSS/SCSS files
const cssContent = fs.readFileSync('./src/styles/components.css', 'utf8');
const cssAst = postcss.parse(cssContent);

// For HTML templates
const htmlContent = fs.readFileSync('./src/templates/index.html', 'utf8');
const htmlAst = parseHTML(htmlContent);

// Extract patterns from all sources
const patterns = {
  components: extractComponentPatterns(componentInfo),
  styling: extractStylingPatterns(cssAst),
  html: extractHTMLPatterns(htmlAst)
};

// HTML-specific drift detection
const htmlDriftPatterns = {
  inlineStyles: findInlineStyles(htmlAst),        // style="color: red"
  customElements: findCustomButtons(htmlAst),     // <button> vs <Button>
  classInconsistency: analyzeClassPatterns(htmlAst), // btn vs button
  accessibilityDrift: checkA11yPatterns(htmlAst),    // missing aria-*
  hardcodedValues: findHardcodedSizes(htmlAst)    // width="300px"
};
```

### 3. Pattern Recognition System

#### Design System Learning
```javascript
// Example patterns it would learn:
{
  "components": {
    "buttons": {
      "primary": "bg-blue-500 text-white px-4 py-2",
      "secondary": "bg-gray-200 text-gray-800 px-4 py-2",
      "component": "Button" // preferred component
    }
  },
  "styling": {
    "colors": {
      "primary": ["#3b82f6", "var(--primary-color)", "blue-500"],
      "text": ["#1f2937", "var(--text-color)", "gray-800"],
      "background": ["#ffffff", "var(--bg-color)", "white"]
    },
    "spacing": {
      "common": ["8px", "16px", "24px", "32px"], // 8px grid detected
      "utilities": ["m-2", "p-4", "gap-6"], // Tailwind patterns
      "custom": ["margin: 20px"] // Drift candidates
    },
    "typography": {
      "sizes": ["12px", "14px", "16px", "18px", "24px"],
      "weights": ["400", "500", "600", "700"],
      "families": ["Inter", "system-ui", "sans-serif"]
    },
    "zIndex": {
      "range": [1, 10, 50, 100, 1000],
      "violations": ["z-index: 9999"] // Arbitrary values
    }
  }
}
```

#### Naming Conventions
- Component naming patterns (PascalCase, suffixes)
- File organization structure
- Props naming patterns

### 4. File Watching (using `chokidar`)
```javascript
const watcher = chokidar.watch('src/**/*.{js,jsx,ts,tsx}');
watcher.on('change', (path) => {
  // Re-analyze changed file
  // Update pattern database
  // Generate updated audit report
});
```

### 5. Storage Layer

#### Pattern Database (JSON/SQLite)
```json
{
  "project": {
    "name": "my-app",
    "framework": "react",
    "lastUpdated": "2025-01-20T10:30:00Z"
  },
  "components": {
    "Button": {
      "file": "src/components/Button.tsx",
      "props": ["variant", "size", "onClick"],
      "usage": 23,
      "lastSeen": "2025-01-20T10:30:00Z"
    }
  },
  "patterns": {
    // Learned design patterns
  }
}
```

### 6. Audit Engine

#### Drift Detection Checks
- **Component Drift**: Flag custom buttons when Button component exists
- **Styling Drift**: Detect inconsistent spacing, colors, typography
- **CSS Token Drift**: Custom colors instead of design system variables
- **HTML Template Drift**: Inline styles, custom elements, class inconsistencies
- **Accessibility Drift**: Missing or inconsistent ARIA attributes
- **Spacing Drift**: Values outside established grid system (8px, 16px, 24px)
- **Typography Drift**: Font sizes/weights not in design scale
- **Z-Index Drift**: Arbitrary z-index values outside defined range
- **Pattern Drift**: Check for reinvented solutions vs existing patterns
- **Utility Class Drift**: Inconsistent Tailwind/CSS utility usage

#### Drift Report Generation
```markdown
# Drift Detection Report - Generated 2025-01-20

## 🔴 Active Drift Detected

### CSS Token Drift
- **File**: `src/components/CustomCard.tsx:15`
- **Drift**: Using `#1234ff` instead of `var(--primary-color)`
- **Fix**: Replace with design token or `blue-500` utility
- **Impact**: Color inconsistency, harder to theme

### Spacing Drift
- **File**: `src/pages/Dashboard.css:23`
- **Drift**: `margin: 20px` breaks 8px grid system
- **Fix**: Use `margin: 16px` or `m-4` utility class
- **Impact**: Visual rhythm inconsistency

### Typography Drift  
- **File**: `src/components/Heading.tsx:8`
- **Drift**: `font-size: 19px` not in design scale
- **Fix**: Use `text-lg` (18px) or `text-xl` (20px)
- **Impact**: Typography scale violation

### HTML Template Drift
- **File**: `src/templates/dashboard.html:34`
- **Drift**: `<button style="background: red; padding: 12px">` (inline styles)
- **Fix**: Use Button component or utility classes `<button class="btn btn-danger">`
- **Impact**: Bypasses design system, harder to maintain

### Accessibility Drift
- **File**: `public/index.html:67`
- **Drift**: `<button onclick="delete()">Delete</button>` (missing aria-label)
- **Fix**: Add `aria-label="Delete item"` for screen readers
- **Impact**: Accessibility compliance violation

### Class Naming Drift
- **File**: `src/templates/card.html:15`
- **Drift**: Using `class="card-button"` when standard is `class="card__button"`
- **Fix**: Follow BEM naming convention consistently
- **Impact**: CSS selector confusion, style inheritance issues
```

### 7. MCP Server Integration

#### Proactive Design Consultation Functions
```typescript
// Core consultation functions for coding agents
interface MCPFunctions {
  // Before implementing any frontend change
  consult_before_change(intent: string, targetFiles?: string[]): DesignGuidance;
  
  // Validate code before writing to files  
  validate_proposed_code(code: string, filePath: string): ValidationResult;
  
  // Get component recommendations
  get_component_recommendations(description: string): ComponentSuggestions;
  
  // Check CSS/styling compliance
  check_style_compliance(styles: object): StyleValidation;
  
  // Get current design system state
  get_current_patterns(): DesignSystemSnapshot;
  
  // Real-time drift analysis
  analyze_drift(filePath?: string): DriftReport;
}

// Example responses
interface DesignGuidance {
  recommendedComponent: string;
  styling: {
    colors: string[];
    spacing: string[];
    typography: string[];
  };
  existingPatterns: string[];
  warnings: string[];
}

interface ValidationResult {
  compliant: boolean;
  issues: DriftIssue[];
  suggestions: string[];
  complianceScore: number;
}
```

#### MCP Server Architecture
```javascript
// MCP server exposes drift detector as design consultant
const mcpServer = {
  tools: [
    {
      name: "consult_before_change",
      description: "Get design guidance before implementing frontend changes",
      inputSchema: {
        intent: "Description of intended change",
        targetFiles: "Optional array of files to modify"
      }
    },
    {
      name: "validate_proposed_code", 
      description: "Validate code against design system before implementation",
      inputSchema: {
        code: "Code to validate",
        filePath: "Target file path"
      }
    },
    {
      name: "get_component_recommendations",
      description: "Get existing component recommendations for new features", 
      inputSchema: {
        description: "Description of needed component functionality"
      }
    }
  ]
};
```

### 8. ESLint Plugin Integration (Optional)
```javascript
// Custom ESLint rules for real-time feedback
module.exports = {
  rules: {
    'ui-auditor/use-design-system-button': {
      // Flag custom button elements
    },
    'ui-auditor/consistent-spacing': {
      // Check spacing patterns
    }
  }
};
```

#### MCP Integration Benefits
```markdown
# Instructions for Coding Agent - Drift Prevention Context

## Current Design System Status
- **Drift Level**: Low (87% compliance)
- Use `Button` component for all buttons (23 existing usages)
- Follow 8px spacing grid (use: p-2, p-4, p-6) 
- Primary color: blue-500, Text: gray-800

## Active Drift Patterns to Avoid
- ❌ Don't create custom button styles (3 violations found)
- ❌ Don't use p-5 spacing (breaks 8px grid)
- ❌ Don't recreate Card component variations

## Real-time Drift Prevention
- Always check `get_design_patterns()` before creating new components
- Use `validate_implementation()` to prevent drift introduction
- Call `suggest_component_usage()` for pattern recommendations
```

## Tech Stack

### Dependencies
```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "chokidar": "^3.5.3",
    "react-docgen": "^8.0.1",
    "react-docgen-typescript": "^2.4.0",
    "postcss": "^8.4.31",
    "css-tree": "^2.3.1",
    "postcss-scss": "^4.0.9",
    "node-html-parser": "^6.1.12",
    "glob": "^10.3.0",
    "fs-extra": "^11.1.1",
    "chalk": "^5.3.0"
  }
}
```

### Project Structure
```
react-ui-auditor/
├── src/
│   ├── cli/              # Commander.js CLI setup
│   ├── analyzers/        # Component, CSS, and HTML parsing engines
│   │   ├── component.js  # React component analysis
│   │   ├── css.js        # CSS/SCSS pattern extraction
│   │   ├── html.js       # HTML template analysis
│   │   └── styled.js     # Styled-components analysis
│   ├── patterns/         # Pattern recognition engine
│   ├── watcher/          # File watching with chokidar
│   ├── storage/          # Pattern database management
│   ├── drift-detector/   # Drift detection engine
│   └── reporters/        # Report generation
├── templates/            # Initial project templates
└── tests/
```

## Development Phases

## Development Phases & Milestones

### Phase 1: MVP Foundation (Weeks 1-3)

## Development Phases & Milestones

### Pre-Development Setup (Week 0)
**Goal**: Prepare development environment and external accounts
**Owner**: You (manual setup required)
**AI Model**: N/A (Manual setup only)

#### Manual Setup Required:
- [ ] Create GitHub repository: `react-codebase-guru`
- [ ] Set up GitHub repository settings:
  - [ ] Enable Issues and Projects
  - [ ] Set up branch protection rules
  - [ ] Configure dependabot for security updates
- [ ] Create NPM account and verify email (npmjs.com)
- [ ] Reserve NPM package name: `react-codebase-guru`
- [ ] Set up development machine:
  - [ ] Install Node.js 18+ and npm
  - [ ] Install VS Code or preferred IDE
  - [ ] Install Git and configure user credentials
- [ ] Create accounts for services:
  - [ ] GitHub account for repository hosting
  - [ ] NPM account for package publishing
  - [ ] Stripe account for payment processing (Phase 6)
- [ ] Domain registration (optional): `codebaseguru.dev` or similar
- [ ] Set up project management:
  - [ ] Create GitHub Project board
  - [ ] Set up milestone tracking

#### Environment Variables to Prepare:
```bash
# For development (OPTIONAL - only needed for automation)
GITHUB_TOKEN=ghp_xxx  # Only for automated releases and dependabot
NPM_TOKEN=npm_xxx     # Only for automated NPM publishing

# For testing (OPTIONAL)
SLACK_WEBHOOK=https://hooks.slack.com/xxx  # Optional: testing notifications

# For CI/CD (set in GitHub Secrets - ONLY if using automated releases)
NPM_PUBLISH_TOKEN=npm_xxx  # For automated publishing
DOCKER_USERNAME=yourusername  # For Docker publishing
DOCKER_PASSWORD=dockerpassword
```

**Note**: GitHub token is ONLY needed for automated releases and CI/CD. Manual development and publishing can be done without it.

### Phase 1: MVP Foundation (Weeks 1-3)

#### Milestone 1.1: Project Foundation & Core Parsing (Week 1)
**Goal**: Set up project and basic file analysis
**Dependencies**: Pre-development setup completed
**AI Model**: Claude Sonnet (good for standard implementation patterns)

**Development Setup Tasks:**
- [ ] Initialize Git repository: `git init`
- [ ] Create initial project structure:
  ```
  react-codebase-guru/
  ├── src/
  ├── tests/
  ├── docs/
  ├── examples/
  ├── .github/workflows/
  └── scripts/
  ```
- [ ] Initialize NPM project: `npm init -y`
- [ ] Set up package.json with proper metadata
- [ ] Install core dependencies:
  ```bash
  npm install react-docgen react-docgen-typescript postcss css-tree node-html-parser commander chokidar glob fs-extra chalk
  ```
- [ ] Install dev dependencies:
  ```bash
  npm install --save-dev jest @types/jest rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-babel rollup-plugin-terser
  ```
- [ ] Set up TypeScript configuration (`tsconfig.json`)
- [ ] Configure Jest for testing (`jest.config.js`)
- [ ] Set up ESLint and Prettier
- [ ] Create initial README.md with project description
- [ ] Set up .gitignore file
- [ ] Create initial commit and push to GitHub

**Core Implementation:**
- [ ] Implement ComponentAnalyzer for React files (.tsx, .jsx)
- [ ] Implement CSSAnalyzer for stylesheet parsing  
- [ ] Implement HTMLAnalyzer for template parsing
- [ ] Basic CLI with `guru scan` command
- [ ] File discovery with glob patterns
- [ ] JSON output generation
- [ ] Error handling for malformed files

**Testing Setup:**
- [ ] Create test file structure
- [ ] Set up TestFileSystem for mocking projects
- [ ] Write initial unit tests for parsers
- [ ] Configure GitHub Actions for CI

**Deliverable**: CLI tool that can parse and extract patterns from React projects

#### Milestone 1.2: Pattern Recognition (Week 2)
**Goal**: Learn and store project-specific patterns
**AI Model**: Claude Sonnet (algorithmic pattern detection)

**Implementation:**
- [ ] Implement PatternExtractor for component patterns
- [ ] Detect spacing grid system (4px, 8px, etc.)
- [ ] Extract color scheme and design tokens
- [ ] Identify typography scale
- [ ] Component usage frequency tracking
- [ ] Basic pattern storage (JSON file in `.codebase-guru/`)
- [ ] Pattern similarity detection
- [ ] Configuration file support (`guru.config.js`)

**Documentation:**
- [ ] Create configuration documentation
- [ ] Add examples of detected patterns
- [ ] Write pattern recognition algorithm explanation

**Testing:**
- [ ] Unit tests for pattern extraction
- [ ] Integration tests with sample projects
- [ ] Performance tests for large projects

**Deliverable**: Tool that builds a "design system fingerprint" of your project

#### Milestone 1.3: Basic Drift Detection (Week 3)
**Goal**: Identify inconsistencies and generate reports
**AI Model**: Claude Sonnet (straightforward rule-based detection)

**Implementation:**
- [ ] Implement core DriftAnalyzer
- [ ] Component duplication detection
- [ ] Inline style violation detection
- [ ] Spacing grid violation detection
- [ ] Color token drift detection
- [ ] Markdown report generation
- [ ] Compliance score calculation
- [ ] File-specific violation tracking

**CLI Enhancements:**
- [ ] Add `guru report` command
- [ ] Add `guru init` command for project setup
- [ ] Improve CLI output formatting with colors
- [ ] Add verbose/quiet mode options

**Testing:**
- [ ] End-to-end tests with real project scenarios
- [ ] Drift detection accuracy tests
- [ ] Report generation tests

**Documentation:**
- [ ] Usage examples and tutorials
- [ ] Violation type documentation
- [ ] Best practices guide

**Deliverable**: Working drift detector with human-readable reports

### Phase 2: Real-time Capabilities (Week 4)

#### Milestone 2.1: File Watching System (Week 4)
**Goal**: Real-time drift detection during development
**AI Model**: Claude Sonnet (file system operations and caching)

**Implementation:**
- [ ] Implement FileWatcher with chokidar
- [ ] File change debouncing (300ms)
- [ ] Incremental analysis engine with file hashing
- [ ] Memory-efficient caching system
- [ ] Desktop notifications for violations (using node-notifier)
- [ ] Watch mode CLI command (`drift-detect watch`)
- [ ] Graceful shutdown handling

**Performance Optimization:**
- [ ] Implement batch processing for multiple file changes
- [ ] Add memory usage monitoring
- [ ] Optimize for large project performance
- [ ] Add performance benchmarking tools

**User Experience:**
- [ ] Clear watch mode status indicators
- [ ] Real-time violation count display
- [ ] Keyboard shortcuts for common actions
- [ ] Log file for watch session history

**Testing:**
- [ ] File watching integration tests
- [ ] Performance tests with 1000+ file projects
- [ ] Memory leak detection tests
- [ ] Cross-platform compatibility tests

**Deliverable**: Real-time drift detection that alerts during coding

### Phase 3: MCP Integration (Weeks 5-6)

#### Milestone 3.1: MCP Server Foundation (Week 5)
**Goal**: Basic MCP server with core consultation functions

🚨 **MODEL SWITCH REQUIRED** 🚨
**STOP**: Request switch to Claude Opus before starting this milestone
**Reason**: MCP protocol is complex and requires deeper architectural reasoning for proper implementation

**AI Model**: Claude Opus (complex protocol implementation and architecture)

**External Setup Required:**
- [ ] Research MCP protocol specification
- [ ] Set up MCP development environment
- [ ] Test MCP connection with Claude Desktop (if available)

**Implementation:**
- [ ] Set up MCP server architecture
- [ ] Implement MCP protocol message handling
- [ ] Implement `get_current_patterns()` function
- [ ] Implement `analyze_drift()` function
- [ ] Basic error handling and validation
- [ ] Connection management and authentication
- [ ] JSON response formatting for AI agents
- [ ] Logging and debugging capabilities

**Security & Reliability:**
- [ ] Input sanitization for all MCP functions
- [ ] Rate limiting implementation
- [ ] Connection timeout handling
- [ ] Error recovery mechanisms

**Testing:**
- [ ] MCP protocol compliance tests
- [ ] Function response validation tests
- [ ] Load testing for concurrent connections
- [ ] Security penetration testing

**Documentation:**
- [ ] MCP integration guide
- [ ] Function reference documentation
- [ ] Troubleshooting guide

**Deliverable**: MCP server that AI agents can connect to

#### Milestone 3.2: Advanced MCP Functions (Week 6)
**Goal**: Proactive design consultation capabilities
**AI Model**: Claude Opus (continue with complex consultation logic)

**Implementation:**
- [ ] Implement `consult_before_change()` function
- [ ] Implement `validate_proposed_code()` function
- [ ] Implement `get_component_recommendations()` function
- [ ] Implement `check_style_compliance()` function
- [ ] Intent parsing and pattern matching algorithms
- [ ] Actionable suggestion generation
- [ ] Context-aware component discovery

**AI Integration Features:**
- [ ] Natural language intent understanding
- [ ] Component similarity matching
- [ ] Style rule explanation generation
- [ ] Progressive suggestion refinement

**Testing:**
- [ ] MCP function accuracy tests
- [ ] AI agent integration tests
- [ ] Performance tests for complex queries
- [ ] User acceptance testing with real scenarios

**Documentation:**
- [ ] MCP function usage examples
- [ ] AI agent integration tutorials
- [ ] Best practices for AI-assisted development

**Deliverable**: Full MCP integration with proactive design consultation

### Phase 4: Advanced Features (Weeks 7-8)

#### Milestone 4.1: Enhanced Analytics (Week 7)
**Goal**: Advanced pattern analysis and historical tracking

🚨 **MODEL SWITCH REQUIRED** 🚨
**STOP**: Request switch to Claude Sonnet before starting this milestone
**Reason**: Back to standard implementation work - database operations, analytics calculations

**AI Model**: Claude Sonnet (database operations and standard analytics)

**Database Setup:**
- [ ] Set up SQLite for historical data storage
- [ ] Design database schema for analytics
- [ ] Implement data migration system
- [ ] Set up data retention policies

**Implementation:**
- [ ] Drift trend analysis over time
- [ ] Component usage analytics
- [ ] Compliance score trending
- [ ] Pattern evolution tracking
- [ ] Historical data retention and querying
- [ ] Export functionality for metrics (CSV, JSON)
- [ ] Dashboard data API endpoints

**Analytics Features:**
- [ ] Team member contribution tracking
- [ ] Project health scoring
- [ ] Drift hotspot identification
- [ ] Performance impact analysis

**Testing:**
- [ ] Historical data accuracy tests
- [ ] Performance tests with large datasets
- [ ] Data export/import tests
- [ ] Analytics calculation verification

**Deliverable**: Analytics engine with historical drift tracking

#### Milestone 4.2: Configuration & Extensibility (Week 8)
**Goal**: Customizable rules and framework support
**AI Model**: Claude Sonnet (configuration systems and validation)

**Implementation:**
- [ ] Comprehensive configuration system with validation
- [ ] Custom drift threshold settings
- [ ] Framework-specific adaptations (Vue, Angular prep)
- [ ] Plugin architecture foundation
- [ ] Custom rule definition system
- [ ] Project template system
- [ ] Config validation and migration tools

**Extensibility Features:**
- [ ] Custom parser plugins
- [ ] Rule engine for custom violations
- [ ] Template system for common project types
- [ ] Integration hooks for third-party tools

**User Experience:**
- [ ] Configuration wizard CLI
- [ ] Config file generation tools
- [ ] Validation with helpful error messages
- [ ] Migration scripts for config updates

**Testing:**
- [ ] Configuration validation tests
- [ ] Plugin system tests
- [ ] Template generation tests
- [ ] Migration script tests

**Deliverable**: Highly configurable tool adaptable to different projects

### Phase 5: Production & Distribution (Weeks 9-10)

#### Milestone 5.1: Testing & Quality Assurance (Week 9)
**Goal**: Production-ready reliability and performance
**AI Model**: Claude Sonnet (excellent at comprehensive testing)

**Comprehensive Testing:**
- [ ] Achieve >90% unit test coverage
- [ ] Integration tests with 5+ real open-source projects
- [ ] Performance benchmarks and optimization
- [ ] Error handling for all edge cases
- [ ] Memory leak detection and fixing
- [ ] Cross-platform compatibility (Windows, macOS, Linux)
- [ ] Security audit and vulnerability scanning

**Quality Assurance:**
- [ ] Code review checklist creation
- [ ] Static analysis tool integration
- [ ] Automated security scanning
- [ ] Performance regression testing
- [ ] User acceptance testing scenarios

**Production Readiness:**
- [ ] Logging and monitoring setup
- [ ] Error reporting system
- [ ] Graceful degradation handling
- [ ] Resource cleanup on exit

**Documentation QA:**
- [ ] Technical documentation review
- [ ] User guide testing
- [ ] API documentation validation
- [ ] Tutorial walkthrough verification

**Deliverable**: Production-quality codebase with full test coverage

#### Milestone 5.2: Packaging & Release (Week 10)
**Goal**: Distribute as npm package with documentation
**AI Model**: Claude Sonnet (build systems and documentation)

**Packaging Setup:**
- [ ] NPM package configuration optimization
- [ ] CLI binary generation for multiple platforms
- [ ] Build pipeline setup with Rollup
- [ ] Package size optimization
- [ ] Dependencies audit and cleanup

**Release Infrastructure:**
- [ ] GitHub Actions CI/CD pipeline
- [ ] Automated testing on multiple Node versions
- [ ] Automated security scanning
- [ ] Release automation scripts
- [ ] Version bumping automation

**Documentation & Marketing:**
- [ ] Comprehensive README with examples
- [ ] Getting started tutorial
- [ ] API reference documentation
- [ ] Example project repositories
- [ ] Demo videos and screenshots

**Launch Preparation:**
- [ ] Beta testing with target users
- [ ] Community feedback incorporation
- [ ] Launch announcement preparation
- [ ] Social media content creation

**Manual Release Tasks:**
- [ ] Create GitHub release (v1.0.0)
- [ ] Publish to NPM registry
- [ ] Submit to relevant developer communities
- [ ] Update personal/company website

**Deliverable**: Published npm package ready for community use

### Phase 6: Premium Features (Weeks 11-12)

#### Milestone 6.1: Team Collaboration Features (Week 11)
**Goal**: Multi-user workflows and team integration
**AI Model**: Claude Sonnet (standard feature implementation)

**Team Features Implementation:**
- [ ] Team drift reports and analytics
- [ ] Shared pattern libraries across projects
- [ ] Role-based permissions system
- [ ] Multi-project management interface
- [ ] Team onboarding templates and guides

**Integration Setup:**
- [ ] Slack/Discord bot development
- [ ] Webhook system for notifications
- [ ] Team dashboard API
- [ ] User management system
- [ ] Authentication and authorization

**Collaboration Tools:**
- [ ] Pattern sharing between team members
- [ ] Commenting system for violations
- [ ] Approval workflows for pattern changes
- [ ] Team performance metrics

**Testing:**
- [ ] Multi-user workflow testing
- [ ] Permission system validation
- [ ] Integration testing with Slack/Discord
- [ ] Performance testing with team scenarios

**Deliverable**: Team-focused features for larger organizations

#### Milestone 6.2: Enterprise Integration (Week 12)
**Goal**: Enterprise-grade features and integrations

🚨 **MODEL SWITCH REQUIRED** 🚨
**STOP**: Request switch to Claude Opus before starting this milestone
**Reason**: Complex enterprise architecture, security considerations, and integration patterns

**AI Model**: Claude Opus (enterprise architecture and security)

**Enterprise Features:**
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] PR/MR drift checking with blocking capabilities
- [ ] SSO authentication (SAML, OIDC) preparation
- [ ] Webhook support for custom integrations
- [ ] Enterprise security compliance features
- [ ] Custom ESLint rule generation
- [ ] White-label customization options

**Payment Integration Setup** (Manual):
- [ ] Set up Stripe account and configure products
- [ ] Implement subscription management
- [ ] Set up billing webhooks
- [ ] Create customer portal
- [ ] Set up usage tracking for billing

**Enterprise Infrastructure:**
- [ ] Docker containerization
- [ ] Kubernetes deployment configurations
- [ ] High availability setup
- [ ] Monitoring and alerting system
- [ ] Backup and disaster recovery

**Compliance & Security:**
- [ ] Security documentation
- [ ] Privacy policy and terms of service
- [ ] GDPR compliance features
- [ ] SOC2 preparation documentation

**Testing:**
- [ ] Enterprise integration tests
- [ ] Security penetration testing
- [ ] Scalability testing
- [ ] Compliance validation

**Deliverable**: Enterprise-ready solution with compliance features

## Manual Tasks Summary

### One-Time Setup (You Must Do):
1. **GitHub repository creation and configuration**
2. **NPM account setup and package reservation**
3. **Development environment setup**
4. **External service accounts** (Stripe, domain registration)
5. **Environment variables and secrets configuration**
6. **Initial project structure decisions**

### Periodic Manual Tasks:
1. **Code reviews and quality checks**
2. **Community engagement and user feedback**
3. **Marketing and content creation**
4. **Partnership discussions**
5. **Strategic decision making**
6. **Release announcements and communications**

### Coding Agent Guidance

**Model Switch Protocol:**
🚨 When you see a **MODEL SWITCH REQUIRED** notice:
1. **STOP all development work immediately**
2. **Commit any current progress** with detailed message
3. **Create a handoff document** summarizing:
   - What has been completed
   - Current state of the codebase
   - Next steps for the new model
   - Any architectural decisions made
4. **Request human intervention** to switch AI models
5. **Do not proceed** until confirmation of model switch

**For Each Milestone, the Coding Agent Should:**
1. **Read the entire milestone description carefully**
2. **Complete tasks in the specified order** (dependencies matter)
3. **Run tests after each major implementation**
4. **Update documentation alongside code changes**
5. **Commit frequently with descriptive messages**
6. **Ask for human review before complex architectural decisions**
7. **Flag any tasks that require external account setup**
8. **Provide progress updates and blockers clearly**

**Code Quality Standards:**
- **All functions must have JSDoc comments**
- **Error handling required for all external operations**
- **Tests must be written for all new functionality**
- **Configuration options must be documented**
- **CLI commands must have help text**
- **All external dependencies must be justified**

**Communication Protocol:**
- **Daily progress updates with completed checklist items**
- **Immediate escalation of blockers or unclear requirements**
- **Code review requests before milestone completion**
- **Documentation updates with each feature implementation**

## Success Criteria by Phase

### Phase 1 Success Metrics
- [ ] Successfully parse 100+ component React project in <5 seconds
- [ ] Detect 5+ common drift patterns accurately
- [ ] Generate actionable reports with specific file/line references
- [ ] Handle malformed files gracefully without crashing

### Phase 2 Success Metrics
- [ ] Real-time detection with <500ms latency after file save
- [ ] Memory usage stays under 200MB for projects with 1000+ files
- [ ] 95% uptime during extended watching sessions
- [ ] Accurate incremental analysis (no false negatives)

### Phase 3 Success Metrics
- [ ] MCP server handles 100+ concurrent requests/minute
- [ ] AI agents receive responses in <100ms
- [ ] 99% accuracy in component recommendations
- [ ] Zero security vulnerabilities in MCP implementation

### Phase 4+ Success Metrics
- [ ] Support for 3+ major CSS frameworks (Tailwind, Bootstrap, etc.)
- [ ] Sub-second analysis for projects with 5000+ files
- [ ] 95%+ user satisfaction in beta testing
- [ ] Enterprise security compliance (SOC2, GDPR ready)

## Risk Mitigation by Milestone

### Technical Risk Mitigation
- **Milestone 1.1**: Create fallback parsers for unsupported syntax
- **Milestone 2.1**: Implement circuit breakers for file system errors
- **Milestone 3.1**: Rate limiting and authentication from day one
- **Milestone 5.1**: Automated testing prevents regressions

### Market Risk Mitigation
- **Milestone 1.3**: Early user feedback on drift detection accuracy
- **Milestone 3.2**: Validate AI agent integration with real users
- **Milestone 6.1**: Assess enterprise demand before heavy investment
- **Continuous**: Community building through open source releases

## User Workflow Examples

### MCP Server Integration Workflow

#### Initial Setup
```bash
# Install and connect MCP server
npm install -g react-ui-auditor-mcp
# MCP server auto-discovered by Claude Desktop, Cursor, etc.
```

#### Typical Development Session

**1. Project Initialization**
```
User: "I want to add a new dashboard page to my React app"

AI Agent: [Calls MCP] audit_project() -> Gets current design patterns
AI Response: "I'll help you build a dashboard that's consistent with your existing design system. I can see you use:
- Button component with variants: primary, secondary, outline
- 8px spacing grid (p-2, p-4, p-6, m-4, etc.)
- Card component for content sections
- Blue-500 as primary color, gray-800 for text"
```

**2. Feature Implementation**
```
User: "Add a user stats card with a delete button"

AI Agent: 
1. [Calls MCP] get_design_patterns() -> Retrieves component guidelines
2. [Generates code using Card and Button components]
3. [Calls MCP] validate_implementation(generatedCode) -> Checks consistency
AI Response: "Here's your user stats card using your existing Card component and Button with variant='outline' and size='sm' for the delete action..."
```

**3. Real-time Design Consultation**
```
User: "Make the button red and bigger"

AI Agent:
1. [Calls MCP] consult_before_change("red larger button")
   -> Response: "Use Button with variant='danger' and size='lg' instead of custom styling"
2. [Calls MCP] check_style_compliance({backgroundColor: 'red', padding: '16px'})
   -> Response: "❌ Use design tokens: variant='danger' provides red-500, size='lg' provides proper padding"
3. [Generates compliant code]
AI Response: "I've used your existing 'danger' variant and 'lg' size instead of custom styling to maintain design system consistency..."
```

**4. Component Discovery & Recommendation**
```
User: "I need a form input field with validation"

AI Agent: 
1. [Calls MCP] get_component_recommendations("form input with validation")
   -> Response: {
        "existing": ["InputField component with built-in validation", "FormInput with error states"],
        "usage": "import { InputField } from 'src/components/forms'",
        "props": ["value", "onChange", "validation", "errorMessage"],
        "examples": ["Login form uses InputField", "Contact form pattern available"]
      }
2. [Calls MCP] get_current_patterns() -> Gets form styling patterns
AI Response: "I found your InputField component that includes built-in validation and error states. Here's how to implement it following your existing form patterns..."
```

### CLI-Only Workflow (Traditional)

**1. Manual Audit**
```bash
ui-audit scan
# Reviews markdown report
# Manually tells AI about consistency issues
```

**2. Feature Request**
```
User: "Add dashboard page"
AI: [Generates code without project context]
User: [Runs audit, finds 8 inconsistencies]
User: "Fix these issues: use Button component, follow spacing..."
AI: [Fixes issues in second iteration]
```

### MCP Workflow Advantages
- **Zero manual handoff** - AI gets project context automatically
- **Proactive consistency** - Prevents issues rather than fixing them
- **Real-time guidance** - AI knows your patterns during generation
- **Seamless integration** - No context switching between tools

## Pricing Strategy

### Free (Community Edition)
- **Basic component detection** using react-docgen
- **Simple drift reports** in markdown format
- **Manual CLI scanning only** (`drift-detect scan` - full project re-analysis)
- **Single project** support
- **Basic MCP functions** (limited to manual scan results)
- **GitHub integration** for code export
- **Community support** via GitHub issues

**Free tier limitations:**
- No real-time file watching
- No persistent MCP server (agents get stale data)
- Full project re-scan required for each analysis
- No incremental change detection

### Premium Tiers

#### 🔄 Real-time Detection - $12/month
- **MCP server integration** (premium-only feature)
- **Incremental analysis** - only analyzes changed files, not full re-scan
- **Smart change detection** - ignores formatting/whitespace changes
- **Performance optimizations** - in-memory pattern caching
- **Intelligent debouncing** - handles rapid file changes elegantly
- **Context preservation** - maintains state between changes
- **Desktop notifications** - system-level drift alerts
- **Background monitoring** with minimal CPU impact
- **Multiple projects** (up to 5)
- **Priority support** for technical issues

**vs Free CLI limitations:**
- CLI requires manual `drift-detect scan` (full project re-analysis)
- No MCP server (agents can't consult in real-time)
- No incremental analysis (slower on large projects)
- No persistent state between scans

#### 📊 Advanced Analytics - $25/month  
- **Everything in Real-time** +
- **Cloud-based pattern storage** and sync across machines
- **Drift trend analysis** over time with historical charts
- **Compliance scoring** and visual dashboards
- **Team drift reports** ("Alice introduced 5 violations this week")
- **Before/after metrics** tracking and improvement measurement
- **Historical data retention** (6 months)
- **Custom drift thresholds** and alert rules
- **Advanced filtering** and search across drift reports
- **Unlimited projects**
- **API access** for custom integrations

#### 👥 Team Collaboration - $45/month
- **Everything in Analytics** +
- **Team sharing** and collaboration
- **Design system governance** rules and policies
- **Role-based permissions** (admin, developer, viewer)
- **Slack/Discord/Teams** notifications
- **Custom webhook** integrations
- **Shared pattern libraries** across team projects
- **Team onboarding** templates

#### 🏢 Enterprise - $150/month
- **Everything in Team** +
- **CI/CD integration** (GitHub Actions, GitLab, Jenkins)
- **PR/MR drift checks** with blocking rules
- **Custom ESLint rules** generation
- **SSO integration** (SAML, OIDC)
- **On-premise deployment** option
- **Priority support** with SLA
- **Custom training** and consulting
- **White-label** options

### Pricing Strategy

**Anti-circumvention approach:**
- **MCP server** is the key premium differentiator (can't be easily replicated)
- **Performance optimizations** provide genuine value over DIY scripts
- **Cloud features** (sync, backup) add convenience worth paying for
- **Enterprise reliability** vs maintaining custom file watching scripts
- **Support** when DIY solutions break or need updates

**Free tier strategy:**
- Generous enough to provide real value and drive adoption
- Clear limitations that encourage premium upgrades
- CLI-only approach limits integration possibilities
- Manual workflow creates friction that real-time solves

### Value Proposition by Tier
- **Free**: "Stop drift manually"
- **Real-time**: "Catch drift instantly" 
- **Analytics**: "Measure and improve consistency"
- **Team**: "Scale design system governance"
- **Enterprise**: "Enterprise-grade drift prevention"