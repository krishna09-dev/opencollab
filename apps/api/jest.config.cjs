module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/__tests__/env.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/jest.setup.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json"
      }
    ]
  },
  clearMocks: true,
  maxWorkers: 1
};
