# @continuum-js/dom

## 0.7.0

### Minor Changes

- f2f2395: Typed JSX surface. `IntrinsicElements` is no longer `any`: attributes are
  derived per element from the DOM interfaces (`value`, `checked`, `href`, …),
  every attribute accepts a `Behavior<T>` in place of a plain `T`, event props
  are typed from `GlobalEventHandlersEventMap` in both native (`onKeydown`) and
  React-style (`onKeyDown`) casing, `ref` carries the tag's concrete element
  type, and `data-*`/`aria-*` are recognized. SVG elements keep a permissive
  attribute surface (events/ref/class stay typed); custom elements (a dash in
  the tag) accept arbitrary props. No runtime changes.

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

### Minor Changes

- 20ecab7: Error boundaries. New `<Catch fallback={(error, reset) => …}>` component:
  catches a throw while building its children (children must be a thunk) and a
  throw during any nested dynamic-region rebuild, disposes the failed
  subtree's ownership, renders the fallback, and supports `reset`. An error in
  the fallback escalates to the next boundary up; without a boundary the old
  behavior (propagating throw) is unchanged.

  Core fixes shaken out by TDD: `Behavior.listen` now registers the listener
  BEFORE the initial delivery (a set fired while handling the initial value
  was silently lost) and unsubscribes if the initial delivery throws; a
  dynamic region whose render fires a re-entrant update no longer clobbers
  the newer result (epoch guard); a throw mid-`buildScoped` disposes the
  partial scope so no half-built ownership leaks.

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
