---
"@continuum-js/dom": patch
---

Two `dyn` correctness fixes uncovered by the router:

- **Level-triggered rendering.** `dyn` now renders the behavior's current
  value instead of the delivered occurrence, so a listener that re-enters
  with a new moment during the post phase (e.g. a redirect) can no longer be
  clobbered by a stale queued update. Duplicate deliveries of the same value
  no longer rebuild the region.
- **Range-based region sweep.** On rebuild, `dyn` removes everything between
  its markers rather than the recorded node list — a nested dynamic region
  at the root of the subtree (e.g. a lazy page) may have swapped nodes since
  the build, which previously leaked orphan nodes into the DOM.
