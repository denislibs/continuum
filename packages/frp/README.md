# @continuum-js/frp

[Русская версия](./README.ru.md)

The core of classic FRP: `Stream`, `State`, and a transactional scheduler with
rank-ordered, glitch-free propagation. DOM-independent — suitable for games,
data streams, animation, server-side logic.

```ts
import { root, stream, state } from "@continuum-js/frp";

const clicks = stream<void>();
// State lives in a scope: inside a component one exists automatically;
// at module level, declare it explicitly with root().
const count = root(() => state(0).on(clicks, (n) => n + 1));
count.listen((n) => console.log(n)); // 0, 1, 2, ...
clicks.fire();
clicks.fire();
```

- **Stream** — discrete occurrences over time (push): `map`, `filter`, `when`,
  `merge`, `or`, `accum`/`accumE`, `hold`, `once`, `listen`.
- **State** — a reactive value that exists at every moment (pull), plus
  `updates`: `map`, `at` (the state's value at the moments of a stream),
  `combine` (pointwise combination), `flatten` (switching state-of-states /
  state-of-streams), `fromPoll`. Per moment, a cell delivers a single
  coalesced `updates` occurrence.
- Sources: `stream()` with `.fire`, `state(init)` with `.set` and declarative
  transitions `.on(e, (state, event) => next)`; `constant`, `never`, `time`.
- Effects and dedup: `perform` (the IO boundary, `Result`), `distinct`.

Guarantees: within-moment consistency (glitch-free), deterministic handling of
simultaneous occurrences, FIFO observer order, `hold` delayed to the moment
boundary, error isolation in the post phase.
