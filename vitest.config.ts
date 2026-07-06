import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@continuum/frp": r("./packages/frp/src/index.ts"),
      "@continuum/dom": r("./packages/dom/src/index.tsx"),
    },
  },
  esbuild: {
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["packages/*/test/**/*.test.{ts,tsx}"],
  },
});
