# Transactions and time

Every update in Continuum happens inside a **transaction** — one atomic
moment of logical time. `fire(x)` opens a moment; everything that follows
from `x` settles inside it; the moment closes; only then do effects
(`listen`, DOM patches) observe the result.

## Glitch-freedom

If one event feeds two branches that later reconverge (a "diamond"), the
join recomputes **once per moment**, seeing both branches updated:

```ts
const doubled = count.map((n) => n * 2);
const squared = count.map((n) => n * n);
const sum = Behavior.lift2((d, s) => d + s, doubled, squared);
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
- `snapshot` sees Behaviors _as of the start of the moment_.

## The `hold` delay

`hold`/`accum` update Behaviors **at the moment's boundary**. Inside the
transaction that delivers the occurrence, the Behavior still shows its
previous value:

```ts
const count = clicks.accum(0, (_e, n) => n + 1);
const before = clicks.snapshot(count, (_e, n) => n);
// on the 3rd click, `before` is 2 — the value BEFORE this moment
```

This is what makes recursive definitions well-defined: "the new value
depends on the old one" needs an "old one" that is stable within the moment.
The past is available; the present is still forming.

## Effects run after

`listen` handlers run in the _post_ phase, after the moment closes. If a
handler fires a new event (a router redirect, a `perform` response), that
opens a **new** moment — transactions never nest or interleave.

For the full operational story — the three phases, ranks, `switch`, and how
this maps to the Sodium book — see
[FRP-MODEL](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
