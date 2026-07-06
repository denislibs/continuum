import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "@continuum-js/dom" },
  resolve: {
    alias: [
      {
        find: "@continuum-js/dom/jsx-dev-runtime",
        replacement: r("../packages/dom/src/jsx-dev-runtime.ts"),
      },
      {
        find: "@continuum-js/dom/jsx-runtime",
        replacement: r("../packages/dom/src/jsx-runtime.ts"),
      },
      { find: "@continuum-js/dom", replacement: r("../packages/dom/src/index.tsx") },
      { find: "@continuum-js/frp", replacement: r("../packages/frp/src/index.ts") },
    ],
  },
});
