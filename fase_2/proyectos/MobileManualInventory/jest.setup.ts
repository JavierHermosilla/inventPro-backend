import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage for store/tests that persist tokens.
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
