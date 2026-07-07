---
"@continuum-js/eslint-plugin": minor
---

First release. Four rules that catch the "common mistakes" statically, in a
flat-config `recommended` preset:

- `no-impure-combinators` (error) — side effects (`fetch`, `localStorage`,
  `document`, setters/`dispatch`, `Date.now`/`Math.random`) inside
  `accum`/`accumE`/`snapshot`/`lift2`/`lift3` callbacks. `map`/`filter` are
  deliberately not flagged (Array collision) — the frp runtime purity guard
  covers those.
- `no-sample-in-jsx` (error) — `sample()` rendered into JSX freezes the
  value; handlers are fine.
- `require-retain` (warn) — module-level `hold`/`accum`/`snapshot`/lift
  derivations without `.retain()`.
- `prefer-oninput` (warn) — `onChange` on text fields fires natively on
  blur; checkbox/radio/file/select are left alone.

Usage: `import continuum from "@continuum-js/eslint-plugin"` →
`export default [continuum.configs.recommended]`.
