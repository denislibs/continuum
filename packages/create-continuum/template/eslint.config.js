// Flat ESLint config: JS + TypeScript recommended, the Continuum rules
// (impure combinator callbacks, sample() in JSX, missing retain, onChange
// on text fields), and prettier last to disable formatting conflicts.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import continuum from "@continuum-js/eslint-plugin";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  continuum.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
];
