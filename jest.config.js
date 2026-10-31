/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  
  // Transformasi TypeScript & JSX menggunakan babel-jest
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },

  // Mocking asset CSS dan file statis
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Hanya uji komponen yang ditargetkan untuk diekspos
  testMatch: [
    '<rootDir>/src/components/form/**/*.test.(ts|tsx)',
  ],

  // Ruang lingkup pengukuran coverage eksklusif pada TransactionForm.tsx
  collectCoverageFrom: [
    'src/components/form/**/TransactionForm.tsx',
    '!src/components/form/**/index.ts',
    '!src/components/form/**/*.types.ts',
  ],

  // Penegakan ambang batas minimal 90% untuk standard enterprise perbankan
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],
};

