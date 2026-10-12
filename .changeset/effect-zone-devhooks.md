---
"@continuum-js/frp": minor
---

Engine hooks for devtools and law 3 ("layout is an effect"):

- `inEffectZone()` is true while the frame pass runs bindings and effects
  (and while a renderer flushes mount hooks, via `effectZone_`); measures run
  outside it. `withLayout(fn)` suspends the zone for an explicit, lint-visible
  layout read from an effect (a third-party widget's init in `onMount`).
- `setDevHooks({ scope, edge, moment })` installs live counters — scopes,
  subscriptions, moments opened — for the devtools overlay; `null` removes
  them. One null check per event in production.

Size: ~100 B brotli in `frp`; budgets raised to match.
