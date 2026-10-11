/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must require lazily */
// Native modules the data layer touches at import time.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
