module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|#ansi-styles|#supports-color)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^chalk$': '<rootDir>/tests/mocks/chalk.js',
    '^#ansi-styles$': '<rootDir>/tests/mocks/ansi-styles.js',
    '^#supports-color$': '<rootDir>/tests/mocks/supports-color.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000
};