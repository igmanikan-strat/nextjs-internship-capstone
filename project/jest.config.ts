// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@clerk/(.*)$": "<rootDir>/node_modules/@clerk/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-hook-form|@hookform/resolvers|@radix-ui|@tanstack|@clerk)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
