import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "@continuum-js/dom" },
  resolve: {
    alias: existsSync(r("../../packages/frp/src/index.ts"))
      ? [
          {
            find: "@continuum-js/dom/jsx-dev-runtime",
            replacement: r("../../packages/dom/src/jsx-dev-runtime.ts"),
          },
          {
            find: "@continuum-js/dom/jsx-runtime",
            replacement: r("../../packages/dom/src/jsx-runtime.ts"),
          },
          {
            find: "@continuum-js/dom",
            replacement: r("../../packages/dom/src/index.tsx"),
          },
          {
            find: "@continuum-js/std",
            replacement: r("../../packages/std/src/index.ts"),
          },
          {
            find: "@continuum-js/frp",
            replacement: r("../../packages/frp/src/index.ts"),
          },
        ]
      : [], // standalone (e.g. StackBlitz): use the published packages
  },
});
