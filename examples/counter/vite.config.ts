import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Dev server resolves the framework straight from source (no prebuild needed).
export default defineConfig({
  esbuild: { jsx: "transform", jsxFactory: "h", jsxFragment: "Fragment" },
  resolve: {
    alias: {
      "@continuum/frp": r("../../packages/frp/src/index.ts"),
      "@continuum/dom": r("../../packages/dom/src/index.tsx"),
    },
  },
});
