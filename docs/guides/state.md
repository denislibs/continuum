# State and derived values

::: tip In plain words
Creating state and computing other values from it — no hooks, no dependency arrays.
:::

## Two ways to create state

**`wire`** — the default: a cell you read like any value and write with
`.set` from handlers. If you know `useState`, this is it (minus the
re-runs):

```tsx
import { wire } from "@continuum-js/frp";

const theme = wire<"light" | "dark">("light");
<button onClick={() => theme.set("dark")}>dark</button>;
```

**`wire` + `.on`** — the transition form, for when one value changes for
several distinct reasons:

```ts
import { wire, stream } from "@continuum-js/frp";

const inc = stream<void>();
const dec = stream<void>();
const reset = stream<void>();

const count = wire(0)
  .on(inc, (n) => n + 1)
  .on(dec, (n) => n - 1)
  .on(reset, () => 0);
```

Each `.on(event, reducer)` declares one transition. The reducer is
`(state, event) => next` — `useReducer` argument order — and must be pure.
The occurrence and the wire's update share one moment, with the usual
snapshot semantics: anything reading the wire _at_ that moment still sees
the value from before it. And however many transitions fire at once, a
wire delivers **one** coalesced `updates` occurrence per moment.

The rule of thumb: **values you simply overwrite — `.set`; values with
rules for how they change — `.on`.** `.set` is the right tool for form
fields, toggles, the selected tab. The transition form earns its keep the
moment a value has many independent sources of change: every transition
reads top-to-bottom in one place, each source keeps its own meaning, and
the event streams still compose with stream tools like `debounce` and
`at`. When the _story_ of a value matters — undo, persistence, sync — fold
a single action stream instead, and each of those becomes [one more
fold](/guides/patterns#1-actions-redux-without-redux).

## Derived values — only `map`/`combine`

Anything computable from existing wires **must not be stored**:

```ts
import { combine } from "@continuum-js/frp";

const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const label = combine(total, currency, (t, cur) => `${t.toFixed(2)} ${cur}`);
```

The anti-pattern is "compute and write back with a setter":

```ts
// BAD: now you must remember to update total on every change of items
const total = wire(0);
itemsChanged.listen(() => total.set(computeTotal()));
```

That is manual synchronization — exactly what FRP removes. The rule: if a
value is derivable, it is a `map`; `wire` is for primary facts only.

## Reading the current value

- In JSX a wire is placed as is — `{count}` is a binding.
- In an event handler, use `at`, not `sample`:

```ts
const submitted = draft.at(submitClicks);
```

`b.sample()` exists and honestly returns the current value, but it has no
simultaneity semantics: two simultaneous events would see "some" value
depending on ordering. `at` is defined exactly: the value _before_ the
current moment. The practical rule: `sample` for code outside the network
(initialization, tests, integrations), `at` inside it.

## Suppressing redundant updates

A source wire already refuses no-op writes: `.set` with an equal value (by
the cell's `eq`, `Object.is` by default) does nothing. For _derived_ wires,
`distinctB` from `@continuum-js/std` drops consecutive equal values — useful
in front of `dyn`/`Show` so a subtree isn't rebuilt for nothing:

```ts
import { distinctB } from "@continuum-js/std";

const page = distinctB(location().map((u) => u.pathname.split("/")[1]));
```

## State outside components

The model is one sentence: **values are formulas; state and effects belong
to a scope.**

Formulas travel freely. A source `wire` is a plain object: declare it at
module level and import it — that is how the router's `location()` works,
one singleton wire per page. Pure derivations (`map`, `combine`, `filter`,
`at`, …) are _recipes_: they attach to their sources when the first
listener arrives, sleep when the last one leaves, and `sample()` answers
at any time regardless. So a module-level derivation is fine as is:

```ts
// fine: a formula — no owner needed, no lifetime to manage
export const page = location().map((u) => u.pathname);
```

State and effects are different. `hold`, `accum`, `.on`, `perform` (and
stateful std helpers such as `resource` and `count`) each start a process,
and a process must have an owner. Inside a component the owner is the
component's scope, automatically — local state lives in the body and dies
with the subtree (see [Ownership and lifecycle](/concepts/ownership)). At
module level there is no scope, so Continuum throws a teaching error
instead of leaking; declare the lifetime yourself with `root()`:

```ts
import { root } from "@continuum-js/frp";

// app-level state: lives as long as the page, and says so
export const count = root(() =>
  wire(0)
    .on(inc, (n) => n + 1)
    .on(dec, (n) => n - 1),
);
```

When a scope is disposed, its state freezes: a `hold`/`accum`/`.on` wire
keeps answering `sample()` with its final value but never updates again.

(`retain()` still exists, but it is purely a performance hint — it keeps a
hot shared formula attached across listener churn instead of letting it
sleep and re-wake. It is never required for correctness.)

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
