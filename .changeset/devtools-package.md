---
"@continuum-js/devtools": minor
"create-continuum-js": patch
---

New dev-only package `@continuum-js/devtools`: `installDevtools()` patches
the layout-forcing getters and methods (Paul Irish's list) to report a read
made inside an effect — law 3 enforced at runtime, the way the purity guard
enforces law 1 — and shows a live counters overlay (scopes, subscriptions,
moments/s, violations). Returns an uninstall function. The scaffold imports
it behind `import.meta.env.DEV`, so production builds carry none of it.
