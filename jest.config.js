export default {
  setupFiles: ['./.jest/env.js'],
  clearMocks: true,
  collectCoverage: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit/.*|universal-user-agent)/)'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
}
