/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'frontend-dashboard',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  testMatch: ['<rootDir>/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/../__mocks__/styleMock.js'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};
