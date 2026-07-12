---
"@continuum-js/frp": patch
"@continuum-js/dom": patch
---

Heap diet, round 6: 34% below Solid on the js-framework-benchmark memory metric (9.4 vs 14.1 MB at create 10k) and 2.8× faster moment throughput (5M sets: ~460 → 166 ms), with ~zero garbage per moment.

- **Inline first edge.** Most nodes carry exactly one observer (binding chains); the first edge now lives in an inline slot and the `obs` array exists only from the second subscriber on — 30k arrays gone at 10k rows.
- **Owner diet.** A single-node build stores the node itself (`nodes: Node | Node[]`), a list row IS its owner (`EachOwner.key` instead of a `{key, owner}` wrapper), and `disposed`/`mounted` are bits of one flags slot.
- **Allocation-free moments.** The transaction is pooled (an aborted moment is never recycled; moment identity moved to a monotonic `t.id`), the heap array is lazy, `lastQ` holds flat (fn, arg) pairs written by cursor into a reused array, and every stateful node (cells, hold, accum, once, distinct, joins, selector) commits through one cached closure instead of a fresh one per moment. Profiling also showed `array.length = 0` is a V8 runtime call — the cursor scheme eliminates it.

New harness: `npm run bench:heap` in benchmark/ — a CDP heap snapshot aggregated by constructor (who holds the bytes). Size budgets grew consciously by ~250 B (frp) for the inline-edge branches and the pool.
