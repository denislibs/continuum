// The "double run" acceptance gate of PERF-PLAN phase 2: the SAME dom and
// example test suites, but with @continuum-js/vite-plugin compiling JSX into
// cloned templates. Compiled and factory paths must be observably identical.
//   npm run test:compiled
import base from "./vitest.config";
import continuum from "./packages/vite-plugin/src/index";

export default {
  ...base,
  plugins: [continuum()],
  test: {
    ...(base as { test?: object }).test,
    include: [
      "packages/dom/test/**/*.test.{ts,tsx}",
      "packages/test/test/**/*.test.{ts,tsx}",
      "examples/**/*.test.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
};
