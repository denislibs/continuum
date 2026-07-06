import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    // Order matters: subpaths before the bare package alias.
    alias: [
      {
        find: "@continuum/dom/jsx-dev-runtime",
        replacement: r("./packages/dom/src/jsx-dev-runtime.ts"),
      },
      {
        find: "@continuum/dom/jsx-runtime",
        replacement: r("./packages/dom/src/jsx-runtime.ts"),
      },
      { find: "@continuum/dom", replacement: r("./packages/dom/src/index.tsx") },
      { find: "@continuum/frp", replacement: r("./packages/frp/src/index.ts") },
    ],
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@continuum/dom",
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "packages/*/test/**/*.test.{ts,tsx}",
      "examples/*/*.test.{ts,tsx}",
    ],
  },
});
