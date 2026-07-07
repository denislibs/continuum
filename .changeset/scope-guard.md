---
"@continuum-js/dom": minor
---

Lifecycle guard: `onCleanup`, `onMount` and `provide` called outside any
owner (a component body, `root()`, `scope()`) now throw a teaching error
instead of silently doing nothing — the old no-op meant cleanups that never
ran and mount hooks nobody flushed. Building JSX with live bindings outside
`mount` is still allowed (unowned fragments keep their old semantics), and
`use()` outside an owner still returns the context default.
