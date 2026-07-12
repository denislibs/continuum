# Migrating to 1.0

1.0 removes every deprecated alias accumulated by the three renames and the
API polish rounds. One name per concept — nothing else changed: semantics,
transactional guarantees and performance are exactly those of 0.19.

## The codemod

Most of the migration is mechanical. From your project root:

```bash
node node_modules/@continuum-js/frp/../../scripts/codemod-1.0.mjs src
# or copy scripts/codemod-1.0.mjs from the Continuum repo
```

It rewrites every mechanical rename in-place and prints a warning with
instructions for the few call sites that need a human (argument-order
changes). Commit before running; review the diff after.

## Renamed — mechanical

| Before 1.0                | 1.0              |
| ------------------------- | ---------------- |
| `Wire<A>` / `Behavior<A>` | `State<A>`       |
| `wire(init)`              | `state(init)`    |
| `WireSource<A>`           | `StateSource<A>` |
| `Event<A>`                | `Stream<A>`      |
| `newEvent()`              | `newStream()`    |
| `e.gate(b)`               | `e.when(b)`      |
| `ea.orElse(eb)`           | `ea.or(eb)`      |
| `Wire.switchB(w)`         | `flatten(w)`     |
| `Wire.switchE(w)`         | `flatten(w)`     |
| `distinctB(b, eq?)` (std) | `dedupe(b, eq?)` |

## Changed shape — needs a human

| Before 1.0                        | 1.0                                                       |
| --------------------------------- | --------------------------------------------------------- |
| `const [b, set] = newBehavior(x)` | `const b = state(x)` — one value; write via `b.set`       |
| `e.snapshot(b, f)`                | `b.at(e, (value, event) => f(event, value))` — data first |
| `Wire.lift2(f, a, b)`             | `combine(a, b, f)`                                        |
| `Wire.lift3(f, a, b, c)`          | `combine(a, b, c, f)`                                     |
| `Wire.apply(bf, ba)`              | `combine(bf, ba, (f, a) => f(a))`                         |

The codemod converts the single-line `newBehavior` destructuring
automatically and flags the rest.

## Why these names

The naming history — and the reasoning behind each rename — is told in
[History](/history). The short version: `Event` read as one occurrence and
collided with DOM's `Event`; `Behavior` was theory jargon; `Wire` was a
metaphor nobody recognized. `state` is the word you already think in.
