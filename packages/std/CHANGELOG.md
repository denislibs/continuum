# @continuum-js/std

## 0.5.0

### Patch Changes

- Updated dependencies [20ecab7]
  - @continuum-js/frp@0.5.0

## 0.4.1

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).
- Updated dependencies [a54119c]
  - @continuum-js/frp@0.4.1

## 0.4.0

### Patch Changes

- @continuum-js/frp@0.4.0

## 0.3.1

### Patch Changes

- @continuum-js/frp@0.3.1

## 0.3.0

### Minor Changes

- 20d707e: First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
  with proper `exports` maps (`@continuum-js/dom` also exposes `jsx-runtime` /
  `jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
  `npm i @continuum-js/dom` and build without any monorepo tooling.

### Patch Changes

- Updated dependencies [20d707e]
  - @continuum-js/frp@0.3.0
