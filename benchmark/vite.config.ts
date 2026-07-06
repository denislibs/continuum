import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "@continuum/dom" },
  resolve: {
    alias: [
      {
        find: "@continuum/dom/jsx-dev-runtime",
        replacement: r("../packages/dom/src/jsx-dev-runtime.ts"),
      },
      {
        find: "@continuum/dom/jsx-runtime",
        replacement: r("../packages/dom/src/jsx-runtime.ts"),
      },
      { find: "@continuum/dom", replacement: r("../packages/dom/src/index.tsx") },
      { find: "@continuum/frp", replacement: r("../packages/frp/src/index.ts") },
    ],
  },
});
