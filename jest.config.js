export default {
  setupFiles: ['./.jest/env.js'],
  clearMocks: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
  // collectCoverageFrom: ['src/**/{!(octokit),}.js']
}
