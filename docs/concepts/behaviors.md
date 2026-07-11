# Behaviors

`Behavior<A>` is a **reactive value**: the text of an input, the current
user, a counter. It always has a value you can read, JSX can bind to it, and
other values can be derived from it. (The name comes from FRP, where it
formally means "a value across time" — but you don't need the theory to use
it.)

::: tip Behavior or Stream?
If you can **draw it on the screen**, it's a Behavior. If you can **react
to it**, it's an [Stream](/concepts/events). The longer version, with a
thermometer and a knock on the door:
[Stream vs Behavior](/frp-in-plain-words#event-vs-behavior).
:::

## Creating

```ts
import { newBehavior, constant, Behavior } from "@continuum-js/frp";

const [name, setName] = newBehavior(""); // external setter
const count = clicks.accum(0, (_e, n) => n + 1); // fold over an event
const latest = responses.hold(null); // last occurrence
const pi = constant(3.14159); // never changes
const now = Behavior.fromPoll(() => Date.now()); // read the world on sample
```

`newBehavior` is the everyday way to create state — a value plus a setter,
like `useState` without re-runs. The event-based forms (`accum`, `hold`)
shine when state is naturally "a history of things that happened"; they live
in [Streams](/concepts/events).

Setting a value equal to the current one (by `Object.is`) is a **no-op**:
no subscriber wakes, no DOM is touched. A Behavior is a value across time —
"changing" it to the same value is not a change. Pass your own comparison
as the second argument (`newBehavior(user, (a, b) => a.id === b.id)`), or
`() => false` to deliver every set. Note the flip side: mutating an object
in place and setting the same reference is skipped — set a fresh object
instead.

## Deriving

Derived values are built with `map` and `lift`, and the expression structure
_is_ the dependency graph:

```ts
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const label = Behavior.lift2((t, c) => `${t} ${c}`, total, currency);
```

If a value can be computed from existing Behaviors, don't store it — derive
it. `Behavior.apply`, `lift2`, `lift3` combine multiple sources; deriving is
glitch-free (see [Transactions](/concepts/transactions)).

Derivations are **demand-driven**: `map`/`lift`/`filter` are just recipes
until somebody listens (a JSX binding, `.listen()`, or a downstream node
with listeners of its own). The first listener attaches the whole chain up
to its sources; the last one to leave detaches it. A chain nobody listens
to costs nothing and is collected like any garbage — and `sample()` always
answers correctly, warm or cold, by recomputing on the spot. Stateful
derivations (`hold`, `accum`) are the exception: their value depends on
every occurrence, so they stay attached while you can still reach them —
and once unreachable, the engine detaches them after garbage collection.

## Reading

- **In JSX** — place the Behavior itself: `{count}`, `class={cls}`. That is
  a binding, not a snapshot.
- **From an event** — use `snapshot`; it has exact simultaneity semantics.
- **Outside the network** (initialization, tests, integration code) —
  `b.sample()` returns the current value.

```ts
const submitted = submits.snapshot(draft, (_e, text) => text);
```

## Updates

`b.updates` is the `Stream<A>` of the Behavior's changes — the bridge back to
the event world, used by combinators like `debounce(query.updates, 300)`.

A Behavior updates **at the boundary of a moment**: within the very
transaction that changes it, readers still see the old value. That delay is
what makes simultaneous reads well-defined — the whole story is in
[Transactions](/concepts/transactions).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
