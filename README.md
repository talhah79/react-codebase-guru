# React Codebase Guru

Real-time design system drift detection and codebase consultation for React projects.

## Overview

React Codebase Guru is a CLI tool and MCP server that detects and prevents design system drift in React projects. It acts as a real-time drift detector and codebase consultant, learning your project's UI patterns and catching inconsistencies before they accumulate.

## Problem Statement

**Design System Drift**: Codebases gradually drift away from established patterns as:
- Developers forget existing components and create custom variations
- AI coding agents generate inconsistent implementations
- New team members don't know established conventions
- Design system updates aren't consistently applied

## Features

- 🔍 **Pattern Detection**: Automatically learns your project's design patterns
- 🚨 **Real-time Monitoring**: Catches drift as you code with file watching
- 🤖 **AI Agent Integration**: MCP server for proactive design consultation
- 📊 **Compliance Scoring**: Track design system adherence over time
- 🎨 **Multi-Framework Support**: React, TypeScript, CSS, Tailwind, and more
- 📈 **Historical Analytics**: Track drift trends and improvements

## Installation

```bash
npm install -g react-codebase-guru
```

## Quick Start

```bash
# Navigate to your React project
cd my-react-project

# Initialize React Codebase Guru
guru init

# Run a drift analysis
guru scan

# Start real-time monitoring
guru watch

# Generate a detailed report
guru report
```

## Core Commands

- `guru init` - Initialize project monitoring and learn patterns
- `guru scan` - Manual drift analysis of your project
- `guru watch` - Real-time drift detection during development
- `guru report` - Generate detailed drift report
- `guru plan <intent>` - Generate drift-aware feature plan

## Configuration

Create a `guru.config.js` file in your project root:

```javascript
module.exports = {
  include: ['src/**/*.{js,jsx,ts,tsx}'],
  exclude: ['node_modules', 'dist', 'build'],
  framework: {
    type: 'react',
    typescript: true,
    cssFramework: 'tailwind'
  },
  patterns: {
    spacingGrid: 8,
    componentNaming: 'PascalCase'
  },
  thresholds: {
    compliance: 90,
    maxViolations: 5
  }
};
```

## MCP Integration

React Codebase Guru includes an MCP server for AI agent integration:

```bash
# Start MCP server
guru mcp

# The server provides consultation functions for AI agents:
# - consult_before_change()
# - validate_proposed_code()
# - get_component_recommendations()
# - check_style_compliance()
```

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/react-codebase-guru.git
cd react-codebase-guru

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/your-username/react-codebase-guru/wiki)
- 🐛 [Issue Tracker](https://github.com/your-username/react-codebase-guru/issues)
- 💬 [Discussions](https://github.com/your-username/react-codebase-guru/discussions)

## Roadmap

- [ ] Multi-framework support (Vue, Angular, Svelte)
- [ ] Visual diff reports
- [ ] Design tool integration (Figma, Sketch)
- [ ] AI-powered suggestions for pattern improvements
- [ ] Browser extension for real-time web app analysis

---

Built with ❤️ to prevent design system drift and improve code consistency.