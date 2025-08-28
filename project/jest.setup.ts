// jest.setup.ts
import "@testing-library/jest-dom";

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (/DialogContent/.test(args[0])) return;
    originalError.call(console, ...args);
  };
  console.warn = (...args) => {
    if (/DialogContent/.test(args[0])) return;
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
