---
"@continuum-js/eslint-plugin": minor
---

`no-impure-combinators` now also flags `alert`/`confirm`/`prompt`, timers
(`setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`),
`requestAnimationFrame`/`requestIdleCallback`/`queueMicrotask`,
`XMLHttpRequest` and `WebSocket` inside pure combinator callbacks. `console`
stays deliberately unflagged — temporary debug logging in a reducer is
harmless and common.
