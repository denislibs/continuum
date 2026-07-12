---
"@continuum-js/frp": minor
"@continuum-js/dom": minor
"@continuum-js/std": minor
"@continuum-js/router": minor
---

`Wire` is now `State` — the third and last rename (the Event → Stream playbook): `Wire` read as nothing to anyone outside the project, while `state` is the word every React/Vue/Svelte developer already thinks in. Signal was considered and rejected: Continuum has no auto-tracking, and the name would promise Solid semantics.

- `class State<A>`, factory `state(init, eq?)` with `.set`/`.update`/`.on`, interface `StateSource<A>`; the dom helper type is `Reactive<T> = T | State<T>`.
- **Nothing breaks**: `Wire`, `wire`, `WireSource` (and the older `Behavior`) remain as deprecated aliases until 1.0 — existing code keeps compiling and running unchanged.
- Docs (en + ru), examples, the benchmark app and the CLI template all speak `state()` now.
