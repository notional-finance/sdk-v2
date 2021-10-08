module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
  ],
  coverageReporters: ["text", "html"],
  collectCoverage: true
};
