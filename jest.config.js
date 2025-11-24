export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testMatch: ['<rootDir>/src/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/fase_2/'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
