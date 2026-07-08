# @continuum-js/std

## 0.12.0

### Patch Changes

- Updated dependencies [7952800]
  - @continuum-js/frp@0.12.0

## 0.11.0

### Patch Changes

- @continuum-js/frp@0.11.0

## 0.10.0

### Patch Changes

- @continuum-js/frp@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [1539199]
  - @continuum-js/frp@0.9.0

## 0.8.0

### Minor Changes

- b83d961: `persist(key, behavior, storage?)` and `loadPersisted(key, fallback,
storage?)` — localStorage persistence as a boundary sink. Safe by contract:
  corrupted JSON or missing storage (SSR) falls back instead of throwing, a
  throwing `setItem` (quota, private mode) is swallowed so the network never
  breaks because a mirror did. `persist` returns the unlisten — tie it to a
  scope with `onCleanup(persist(key, b))`. The `storage` parameter accepts any
  `StorageLike`, which also makes both functions trivially testable.

### Patch Changes

- @continuum-js/frp@0.8.0

## 0.7.0

### Patch Changes

- @continuum-js/frp@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [02891f9]
  - @continuum-js/frp@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [a36a7ef]
  - @continuum-js/frp@0.6.0

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
