# @continuum-js/std

[Русская версия](./README.ru.md)

The standard library of reusable Continuum FRP combinators — the things you
need every day: timing, async data, stream shaping, helpers for states.
Everything is built on top of `@continuum-js/frp` without reaching into
internals the core doesn't expose.

```ts
import { resource, debounce /* … */ } from "@continuum-js/std";
```

## Timing

A bridge to the wall clock (`setTimeout`/`setInterval`). Each returns a stream
that clears its timer on `dispose()`.

|                   |                                                                   |
| ----------------- | ----------------------------------------------------------------- |
| `debounce(e, ms)` | emit after `ms` of silence; a burst coalesces into its last value |
| `throttle(e, ms)` | let the first occurrence through, then ignore for `ms`            |
| `delay(e, ms)`    | shift each occurrence `ms` later                                  |
| `interval(ms)`    | a source ticking `1, 2, 3, …` every `ms`                          |

## Stream shaping

Derived streams over the graph (glitch-free, rank-ordered).

|                          |                                                       |
| ------------------------ | ----------------------------------------------------- |
| `filterMap(e, f)`        | map that drops `null`/`undefined`                     |
| `pairwise(e)`            | `[prev, curr]`, starting from the second occurrence   |
| `partition(e, pred)`     | split a stream into `[matching, rest]`                |
| `count(e)`               | `State<number>` — how many times the stream has fired |
| `sampleWith(trigger, b)` | the value of `b` at the moment of each `trigger`      |

## States

|                     |                                                                      |
| ------------------- | -------------------------------------------------------------------- |
| `previous(b, init)` | a state lagging one step behind (the value before the latest change) |
| `dedupe(b, eq?)`    | suppresses updates equal to the current value                        |

## Async data (HTTP)

`perform` is the IO boundary (§6.5): the effect runs after the moment closes,
the result comes back into the network as data, and errors are wrapped in a
`Result` rather than thrown.

- **`resource(trigger, fetcher): State<Async<T>>`** — a finite state machine
  `idle → loading → ok | error`. Requests are numbered, so a late response to
  a stale request is dropped (last-request-wins) — a declarative solution to
  the classic response-race bug.
- **`Async<T>`** — the request lifecycle as first-class data.

```ts
// inside a component (a scope exists automatically); at module level — root(() => …)
const query = debounce(input.updates, 300).filter((s) => s.length > 0);
const users = resource(query, (q) =>
  fetch(`/api?q=${q}`).then((r) => r.json()),
);
// users: State<Async<User[]>>  — render off users.status
```

Live example — [`examples/data`](../../examples/data).
