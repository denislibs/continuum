---
"@continuum-js/dom": minor
"@continuum-js/frp": patch
---

Error boundaries. New `<Catch fallback={(error, reset) => …}>` component:
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
