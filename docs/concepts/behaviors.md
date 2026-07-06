# Behaviors

`Behavior<A>` is a **value across time**. Denotationally it is a function
`Time → A`: at every moment it has a value — you can always ask "what is it
now?", never "did it arrive?".

## Creating

```ts
import { newBehavior, constant, Behavior } from "@continuum-js/frp";

const [name, setName] = newBehavior(""); // external setter
const count = clicks.accum(0, (_e, n) => n + 1); // fold over an event
const latest = responses.hold(null); // last occurrence
const pi = constant(3.14159); // never changes
const now = Behavior.fromPoll(() => Date.now()); // read the world on sample
```

`newBehavior` is the hatch for state driven from outside. When there is a
stream of causes, prefer folding it (`accum`, `hold`) — the state's history
stays readable.

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

`b.updates` is the `Event<A>` of the Behavior's changes — the bridge back to
the event world, used by combinators like `debounce(query.updates, 300)`.

A Behavior updates **at the boundary of a moment**: within the very
transaction that changes it, readers still see the old value. That delay is
what makes simultaneous reads well-defined — the whole story is in
[Transactions](/concepts/transactions).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
