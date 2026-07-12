# States

> **State** is the type formerly named **Wire**, and **Behavior** before that — the FRP-literature term; both old names remain deprecated aliases until 1.0.

`State<A>` is a **reactive value**: the text of an input, the current
user, a counter. It always has a value you can read, JSX can bind to it, and
other values can be derived from it. (In FRP literature this is a
"behavior" — a value across time — but you don't need the theory to use
it.)

::: tip State or Stream?
If you can **draw it on the screen**, it's a State. If you can **react
to it**, it's a [Stream](/concepts/events). The longer version, with a
thermometer and a knock on the door:
[Stream vs State](/frp-in-plain-words#event-vs-behavior).
:::

## Creating

```ts
import { state, constant, root, State } from "@continuum-js/frp";

const name = state(""); // a cell with a .set method
const pi = constant(3.14159); // never changes
const now = State.fromPoll(() => Date.now()); // read the world on sample

// stateful folds need an owner at module level:
const count = root(() => clicks.accum(0, (_e, n) => n + 1)); // fold over a stream
const latest = root(() => responses.hold(null)); // last occurrence
```

`state` is the everyday way to create state — a cell you read like any State
and change with `.set`, like `useState` without re-runs. The event-based
forms (`accum`, `hold`) shine when state is naturally "a history of things
that happened"; they live in [Streams](/concepts/events). They are
**stateful**, so they need an owner: inside a component the current scope
owns them automatically; at module level wrap them in `root(...)`, or the
runtime throws a teaching error.

State with named transitions reads best as a cell plus reducers:

```ts
const count = state(0)
  .on(inc, (n) => n + 1)
  .on(dec, (n) => n - 1)
  .on(reset, () => 0);
```

Each reducer takes `(state, event)`; an occurrence and the update it causes
share one moment, and `.on` registers its process in the current scope.

Setting a value equal to the current one (by `Object.is`) is a **no-op**:
no subscriber wakes, no DOM is touched. A State is a value across time —
"changing" it to the same value is not a change. Pass your own comparison
as the second argument (`state(user, (a, b) => a.id === b.id)`), or
`() => false` to deliver every set. Note the flip side: mutating an object
in place and setting the same reference is skipped — set a fresh object
instead.

For read-modify-write there is `update()`:

```ts
count.update((n) => n + 1);
todos.update((list) => [...list, item]);
```

Unlike `set(count.sample() + 1)`, the updater folds over the value staged
by the **current moment**, so several updates inside one `batch` compose
(+2, not +1) — `sample()` inside a batch would still show the pre-moment
value (that's the hold delay working as documented). Equal results are
skipped like any other set.

## Deriving

Derived values are built with `map` and `combine`, and the expression
structure _is_ the dependency graph:

```ts
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const label = combine(total, currency, (t, c) => `${t} ${c}`);
```

If a value can be computed from existing States, don't store it — derive
it. `combine` joins any number of sources — data first, function last;
deriving is glitch-free (see [Transactions](/concepts/transactions)).

Derivations are **formulas**: `map`/`combine`/`filter` are just recipes
until somebody listens (a JSX binding, `.listen()`, or a downstream node
with listeners of its own). The first listener attaches the whole chain up
to its sources; after the last one leaves, the chain goes back to sleep. A
sleeping formula costs nothing — and `sample()` always answers correctly,
warm or cold, by recomputing on the spot. Stateful derivations (`hold`,
`accum`) are different: their value depends on every occurrence, so they
belong to a scope — they stay attached for the scope's lifetime and, once
it is disposed, freeze at their last value.

## Reading

- **In JSX** — place the State itself: `{count}`, `class={cls}`. That is
  a binding, not a snapshot.
- **From an event** — use `at`; it has exact simultaneity semantics.
- **Outside the network** (initialization, tests, integration code) —
  `count.sample()` returns the current value.

```ts
const submitted = draft.at(submits);
```

## Updates

`count.updates` is the `Stream<A>` of the State's changes — the bridge back to
the event world, used by combinators like `debounce(query.updates, 300)`.
A cell delivers **one** coalesced occurrence per moment: several `set`s
inside one batch mean subscribers see only the final value.

A State updates **at the boundary of a moment**: within the very
transaction that changes it, readers still see the old value. That delay is
what makes simultaneous reads well-defined — the whole story is in
[Transactions](/concepts/transactions).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
