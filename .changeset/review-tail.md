---
"@continuum-js/frp": patch
"@continuum-js/dom": patch
---

Small fixes from the adversarial review:

- `frp`: disposing a scope with many children is linear — a child disposed
  by its parent no longer scans the sibling list (a 10k-row teardown was
  quadratic). `perform` turns a `run()` that throws before returning a
  promise into a failed `Result`, like a rejection. The purity-guard error
  names `at`, not the removed `snapshot`.
- `dom`: `draggable`, `spellcheck`, `contenteditable` and `translate` treat
  `false` as a value (`"false"` / `"no"`) instead of removing the attribute,
  which meant "default", not "off".
