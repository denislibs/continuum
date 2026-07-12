import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    // Order matters: subpaths before the bare package alias.
    alias: [
      {
        find: "@continuum-js/dom/jsx-dev-runtime",
        replacement: r("./packages/dom/src/jsx-dev-runtime.ts"),
      },
      {
        find: "@continuum-js/dom/jsx-runtime",
        replacement: r("./packages/dom/src/jsx-runtime.ts"),
      },
      {
        find: "@continuum-js/dom/compiled",
        replacement: r("./packages/dom/src/compiled.ts"),
      },
      {
        find: "@continuum-js/dom",
        replacement: r("./packages/dom/src/index.tsx"),
      },
      {
        find: "@continuum-js/std",
        replacement: r("./packages/std/src/index.ts"),
      },
      {
        find: "@continuum-js/test",
        replacement: r("./packages/test/src/index.ts"),
      },
      {
        find: "@continuum-js/router",
        replacement: r("./packages/router/src/index.ts"),
      },
      {
        find: "@continuum-js/frp",
        replacement: r("./packages/frp/src/index.ts"),
      },
      {
        find: "@continuum-js/vite-plugin/transform",
        replacement: r("./packages/vite-plugin/src/transform.ts"),
      },
    ],
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@continuum-js/dom",
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "packages/*/test/**/*.test.{ts,tsx}",
      "examples/*/*.test.{ts,tsx}",
      "benchmark/src/**/*.test.{ts,tsx}",
    ],
  },
});
