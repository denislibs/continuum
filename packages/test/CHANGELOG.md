# @continuum-js/test

## 0.1.2

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).
- Updated dependencies [a54119c]
  - @continuum-js/frp@0.4.1
  - @continuum-js/dom@0.4.1

## 0.1.1

### Patch Changes

- Updated dependencies [5bdb51a]
  - @continuum-js/dom@0.4.0
  - @continuum-js/frp@0.4.0

## 0.1.0

### Minor Changes

- 56e94d2: First release of the test utilities: `render`/`cleanup` (auto-tracked
  containers on `document.body`), `fire`/`click`/`type` event helpers, `flush`
  (microtask drain for `perform` results) and `advanceTimers` (vitest
  fake-timers integration for `debounce`/`throttle`/`interval`).
