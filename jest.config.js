export default {
  projects: [
    '<rootDir>/jest.config.frontend.js',
    '<rootDir>/core/node/jest.config.js',
  ],
  collectCoverageFrom: [
    "src/hooks/**/*.{ts,tsx}",
    "core/node/src/**/*.{ts,tsx}",
    "!core/node/src/index.ts",
    "!core/node/src/types.ts",
    "!core/node/src/**/index.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};
