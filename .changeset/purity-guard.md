---
"@continuum-js/frp": minor
---

Purity guard: firing a source from inside a pure combinator callback
(`map`/`filter`/`snapshot`/`accum`/lift) now throws a teaching error instead
of silently joining the moment being computed — the old behavior injected an
occurrence into a half-drained graph, losing or reordering updates. Effects
belong at the boundary: handlers, `listen`, `perform`. Batching several sets
in one `Transaction.run` body and setting from post-phase listeners keep
working unchanged.
