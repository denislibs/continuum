---
"@continuum-js/frp": minor
"@continuum-js/dom": minor
---

- `frp`: `keyed(dict, eq?)` — per-key cells over a `State<Record | Map>`.
  ONE process watches the dictionary; an update stages only the cells whose
  value changed. The fine-grained answer to N rows selecting from one
  normalized store: one edge on the store instead of one per row. Cells are
  lazy and evicted when unobserved, like `selector`.
- `dom`: `asState(v)` normalizes a `Reactive<T>` prop (a State or a plain
  value) to a `State<T>` — the helper a reusable component needs.
- `dom/layout`: `createVisibilityObserver(opts?)` — one
  `IntersectionObserver` per list, a `State<boolean>` per element; cells
  unobserve with their owner, the observer disconnects with its creator.
