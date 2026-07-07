// Heap stress harness (`npm run stress`): same setup as the main config,
// but only the heap test, in a forked worker started with --expose-gc so
// the test can force collections between measurements.
import base from "./vitest.config";

export default {
  ...base,
  test: {
    ...(base as { test?: object }).test,
    include: ["packages/dom/test/dom.heap.stress.test.tsx"],
    pool: "forks",
    poolOptions: {
      forks: { execArgv: ["--expose-gc"] },
    },
  },
};
