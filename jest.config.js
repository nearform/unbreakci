export default {
  setupFiles: ['./.jest/env.js'],
  clearMocks: true,
  collectCoverage: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  // @octokit/* and parts of its dependency tree ship ESM-only builds, so
  // node_modules must be transformed too
  transformIgnorePatterns: [],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
}
