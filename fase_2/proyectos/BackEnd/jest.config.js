export default {
  extensionsToTreatAsEsm: ['.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
