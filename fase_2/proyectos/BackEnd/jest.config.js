export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.env.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
