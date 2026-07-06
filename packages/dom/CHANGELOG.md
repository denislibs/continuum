# @continuum-js/dom

## 0.4.0

### Minor Changes

- 5bdb51a: New `onMount(fn)` lifecycle hook: runs the callback once the current scope's
  nodes are inserted into the DOM — after `mount`, or right after `dyn`/`each`
  insert a freshly built subtree. Use it for focus, measurement, and third-party
  libraries that need a live element. Child scopes mount before their parents;
  callbacks registered in a scope that is disposed before insertion never run.

### Patch Changes

- @continuum-js/frp@0.4.0

## 0.3.1

### Patch Changes

- dc519c9: Two `dyn` correctness fixes uncovered by the router:

  - **Level-triggered rendering.** `dyn` now renders the behavior's current
    value instead of the delivered occurrence, so a listener that re-enters
    with a new moment during the post phase (e.g. a redirect) can no longer be
    clobbered by a stale queued update. Duplicate deliveries of the same value
    no longer rebuild the region.
  - **Range-based region sweep.** On rebuild, `dyn` removes everything between
    its markers rather than the recorded node list — a nested dynamic region
    at the root of the subtree (e.g. a lazy page) may have swapped nodes since
    the build, which previously leaked orphan nodes into the DOM.
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
