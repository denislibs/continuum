# Transactions and time

Every update in Continuum happens inside a **transaction** — one atomic
moment of logical time. `e.fire(x)` opens a moment; everything that follows
from `x` settles inside it; the moment closes; only then do effects
(`listen`, DOM patches) observe the result.

## Glitch-freedom

If one event feeds two branches that later reconverge (a "diamond"), the
join recomputes **once per moment**, seeing both branches updated:

```ts
const doubled = count.map((n) => n * 2);
const squared = count.map((n) => n * n);
const sum = combine(doubled, squared, (d, s) => d + s);
// count: 2 → 3 makes sum go 8 → 15 in one step. "6 + 4" never exists.
```

Internally nodes are ranked by graph depth and processed in rank order, so a
node never fires before its inputs settle. You don't manage this — it is
what "transaction" means here.

## Simultaneity is real

Two occurrences in the same moment are _actually simultaneous_, and the API
forces you to say what that means:

- `Stream.merge(ea, eb, combine)` — simultaneous occurrences are coalesced
  with `combine`, not ordered arbitrarily;
- `at` sees States _as of the start of the moment_.

## The `hold` delay

`hold`/`accum` update States **at the moment's boundary**. Inside the
transaction that delivers the occurrence, the State still shows its
previous value:

```ts
const count = clicks.accum(0, (_e, n) => n + 1);
const before = count.at(clicks);
// on the 3rd click, `before` is 2 — the value BEFORE this moment
```

This is what makes recursive definitions well-defined: "the new value
depends on the old one" needs an "old one" that is stable within the moment.
The past is available; the present is still forming.

## Batching several fires

Each `fire`/`set` normally opens its own moment. When one user action
updates several sources, wrap them in `batch` — everything inside joins
**one** moment: joins recompute once, merges coalesce, observers run once
at the end:

```ts
import { batch } from "@continuum-js/frp";

batch(() => {
  query.set("");
  page.set(1);
  selection.set(null);
}); // one moment: one recompute per join, one DOM patch per binding
```

Nested `batch` calls join the enclosing moment. You rarely need this —
deriving state usually removes the need to set several sources at once —
but when you do set several, `batch` keeps the in-between states from ever
existing.

One rule: a stream carries **at most one occurrence per moment**, so firing
the _same_ stream twice inside one batch throws (silently folding the second
occurrence over pre-moment state would corrupt `accum`). Setting the same
_state_ repeatedly is fine — the last write wins, and its `updates` delivers
a single coalesced occurrence carrying the final value.

## Effects run after

`listen` handlers run in the _post_ phase, after the moment closes. If a
handler fires a new event (a router redirect, a `perform` response), that
opens a **new** moment — transactions never nest or interleave.

For the full operational story — the three phases, ranks, `flatten`, and how
this maps to the Sodium book — see
[FRP-MODEL](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
