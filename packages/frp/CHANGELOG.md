# @continuum-js/frp

## 0.11.0

## 0.10.0

## 0.9.0

### Minor Changes

- 1539199: Purity guard: firing a source from inside a pure combinator callback
  (`map`/`filter`/`snapshot`/`accum`/lift) now throws a teaching error instead
  of silently joining the moment being computed — the old behavior injected an
  occurrence into a half-drained graph, losing or reordering updates. Effects
  belong at the boundary: handlers, `listen`, `perform`. Batching several sets
  in one `Transaction.run` body and setting from post-phase listeners keep
  working unchanged.

## 0.8.0

## 0.7.0

## 0.6.1

### Patch Changes

- 02891f9: Stable ranks under switch (roadmap §14 #6). Rank-propagation targets are
  now refcounted and removed on unsubscribe (a long-lived source used to
  accumulate one dead entry per mount/unmount cycle, slowing every rank bump
  and pinning dead subtrees in memory). switchB/switchE rebase their rank
  back down to the live topology on rewire, so a visit to a deep chain no
  longer inflates ranks forever. A dependency cycle woven through switches
  now fails loudly: the ordinary cycle detector sees the live topology once
  dead targets are gone, and a RANK_LIMIT backstop catches exotic temporal
  cycles with a descriptive error.

## 0.6.0

### Minor Changes

- a36a7ef: Leak fix + `retain()`. The stress suite caught a real core leak: every
  `{b.map(f)}`-style binding on a behavior that outlives its component left
  the derived chain subscribed to the source forever (10k mount/unmount
  cycles = 10k dead listeners). The public `listen` unsubscribe now completes
  the in-graph cascade the engine already had: a derived node whose last
  listener leaves detaches from its inputs.

  Semantics consequence: a derivation shared across mounts (created once at
  module level) auto-disposes after its first consumer unmounts — re-using it
  now throws a descriptive error instead of going silently dead. For
  intentionally long-lived shared derivations there is the new
  `retain()` (on both `Event` and `Behavior`): it exempts the node from the
  cascade. `newBehavior` retains its internal hold automatically — source
  behaviors are unaffected by any of this.

## 0.5.0

### Patch Changes

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

## 0.4.1

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).

## 0.4.0

## 0.3.1

## 0.3.0

### Minor Changes

- 20d707e: First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
  with proper `exports` maps (`@continuum-js/dom` also exposes `jsx-runtime` /
  `jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
  `npm i @continuum-js/dom` and build without any monorepo tooling.
