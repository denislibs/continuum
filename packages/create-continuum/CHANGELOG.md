# create-continuum-js

## 0.1.1

### Patch Changes

- 97819e3: The scaffolded App.tsx now uses the beginner-friendly `newBehavior` counter
  (plain callback + `sample`) instead of `newEvent` + `accum`, so the first
  code a newcomer sees needs no FRP vocabulary.

## 0.1.0

### Minor Changes

- a2e6004: First release of the scaffolder: `npm create continuum-js@latest my-app`
  generates a Vite + TypeScript project wired to the automatic JSX runtime
  (`jsxImportSource: "@continuum-js/dom"`), with a working FRP counter
  component and a vitest + jsdom test.
