---
"@continuum-js/dom": patch
---

`onMount` callbacks now run UNDER their owner: `onCleanup` (and
`provide`/`use`) inside an `onMount` callback attaches to the mounting
scope — the composable anatomy the docs teach. Previously regions inserted
by `dyn`/`each`/`Show` flushed their mount hooks ownerless, so the
lifecycle guard threw ("onCleanup() was called outside a component/scope");
before the guard existed, those cleanups were silently dropped — a leak.
Found in the wild by the spreadsheet showcase's CI.
