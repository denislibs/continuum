// Flat ESLint config (ESLint 9). Style is Prettier's job — eslint-config-
// prettier at the end disables every formatting rule; here we keep only
// correctness rules.
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.tsout/**",
      "**/node_modules/**",
      "coverage/**",
      // The scaffold template is another project's code (own eslint config,
      // own tsconfig root) — linted by the smoke e2e, not by the monorepo.
      "packages/create-continuum/template/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // Two flat configs live in this repo (the scaffold template ships its
    // own) — typescript-eslint then refuses to infer the tsconfig root.
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    rules: {
      // The FRP core intentionally erases event/behavior payload types at the
      // graph-plumbing layer; `any` there is deliberate, not an accident.
      "@typescript-eslint/no-explicit-any": "off",
      // Allow intentionally-unused args/vars with the conventional _ prefix.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `const self = this` is how listener closures capture the node in the
      // FRP core; a deliberate pattern, not an accident.
      "@typescript-eslint/no-this-alias": ["error", { allowedNames: ["self"] }],
    },
  },
  {
    // The `namespace JSX` declaration is the only way to type JSX elements —
    // the compiler looks it up by name, ES module syntax cannot express it.
    files: ["packages/dom/src/jsx-runtime.ts"],
    rules: { "@typescript-eslint/no-namespace": "off" },
  },
  {
    // Node scripts (smoke, bench, the create-CLI) — plain JS, console is the
    // UI. bench.mjs also ships functions into the page via Playwright
    // evaluate(), so browser globals are legitimate there.
    files: [
      "scripts/**/*.mjs",
      "benchmark/bench.mjs",
      "benchmark/mem.mjs",
      "packages/create-continuum/**/*.mjs",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        document: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
      },
    },
  },
);
