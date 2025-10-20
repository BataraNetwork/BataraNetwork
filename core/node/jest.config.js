module.exports = {
  displayName: 'node',
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Point to the new centralized test directory
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
