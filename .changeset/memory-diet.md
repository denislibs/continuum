---
"@continuum-js/frp": patch
"@continuum-js/dom": patch
---

Memory diet: below Solid on the js-framework-benchmark heap metric (11.5 vs 14.1 MB at create 10k) and on create-10k script time (34.05 vs 39.85 ms, same session), with the selector() retention bug fixed.

- **selector() evicts idle cells.** A key's cell is removed from the internal map once its last listener detaches (leaf nodes now fire `onSleep` on losing their last observer); re-requesting the key hands out a fresh cell seeded from the current selection. 10k cleared rows used to retain ~2.9 MB forever.
- **`wire()` cell fused into its wire** — one object instead of the Cell + Wire pair, a shared pull function instead of a per-cell closure, and bound `set`/`update` fields instead of an `Object.assign` that forked the wire's hidden class: 568 → 320 B per cell.
- **Leaf `listen()` without the wrapper closure** — a sentinel edge target marks leaf observers and `send_` schedules the user callback into the observer phase directly: 313 → 217 B per subscription.
- **DOM bindings as flat (stream, edge) pairs on the owner** (`observe_`/`unobserve_`, internal) — a binding costs two array slots instead of two closures plus a cleanups slot.

Size budgets grew consciously by 50–85 B per package.
