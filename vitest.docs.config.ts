import { defineConfig } from "vitest/config";
import base from "./vitest.config";

// Docs playground has its own tests (transpile, tutorial checks) that live
// under docs/ rather than packages/. Reuse the workspace aliases so the
// playground modules resolve @continuum-js the same way the site does, but
// scope the run to docs tests only.
export default defineConfig({
  resolve: base.resolve,
  esbuild: base.esbuild,
  test: {
    globals: true,
    environment: "jsdom",
    include: ["docs/.vitepress/**/*.test.{ts,tsx}"],
  },
});
