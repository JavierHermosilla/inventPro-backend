/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@react-native-community|expo(nent)?|@expo(nent)?/.*|expo-router|@expo-google-fonts|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-worklets)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.expo/'],
};
