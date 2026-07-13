---
"@continuum-js/dom": patch
---

`each`, `mount`, and `portal` no longer leave "ghost DOM" when a row/region
root is a dynamic region (`dyn`/`Show`/`when`/nested `each`). They swept the
build-time node snapshot, whose middle goes stale when the nested region swaps
its content; they now sweep the live DOM range between the snapshot's stable
first/last boundaries.
