module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};