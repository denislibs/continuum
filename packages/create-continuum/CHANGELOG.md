# create-continuum-js

## 0.1.3

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).

## 0.1.2

### Patch Changes

- 16f745c: The scaffold now ships AGENTS.md (exact API signatures, React habits to
  avoid, bug-preventing rules) and a CLAUDE.md pointer, so AI coding
  assistants working in a fresh project know Continuum idioms out of the box.

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
