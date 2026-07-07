# @continuum-js/eslint-plugin

ESLint rules for [Continuum](https://github.com/denislibs/continuum): catch
the [common mistakes](https://denislibs.github.io/continuum/guides/common-mistakes)
before they run.

```bash
npm i -D @continuum-js/eslint-plugin
```

```js
// eslint.config.js (flat config)
import continuum from "@continuum-js/eslint-plugin";

export default [
  // …your other configs
  continuum.configs.recommended,
];
```

## Rules

| Rule                    | Default | Catches                                                                                                                                                                                           |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-impure-combinators` | error   | `fetch`/`localStorage`/`document`/`alert`/timers/setters/`dispatch`/`Date.now`/`Math.random` inside `accum`, `accumE`, `snapshot`, `lift2`, `lift3` callbacks — combinator functions must be pure |
| `no-sample-in-jsx`      | error   | `{count.sample()}` in JSX — renders once and freezes; bind the behavior itself (handlers are fine)                                                                                                |
| `require-retain`        | warn    | module-level `hold`/`accum`/`snapshot`/lift derivations without `.retain()` — they auto-dispose with their last listener                                                                          |
| `prefer-oninput`        | warn    | `onChange` on text fields — the native `change` event fires on blur; use `onInput` or `bindInput` (checkbox/radio/file/select are fine)                                                           |

## Scope, honestly

Purity is undecidable statically, so these are heuristics tuned against
false positives: `map`/`filter` callbacks are deliberately **not** flagged
(they collide with `Array.prototype`). The runtime purity guard in
`@continuum-js/frp` covers that half dynamically — firing a source inside
any pure combinator throws a teaching error.
