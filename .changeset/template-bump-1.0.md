---
"create-continuum-js": patch
---

Bump the scaffolded template's `@continuum-js/*` dependency ranges to the
current line: `dom`/`frp` to `^1.0.0`, and `vite-plugin`/`eslint-plugin` to
`^0.3.0`. New projects no longer start on stale `0.x` ranges. (The CLI still
stamps the resolved runtime version onto `dom`/`frp` at scaffold time; this
fixes the baked fallback and the dev-dependency ranges, which aren't stamped.)
