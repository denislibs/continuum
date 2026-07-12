# Streams

`Stream<A>` is a stream of **things that happen**: clicks, key presses,
server responses. Each firing (an [occurrence](/glossary#occurrence))
carries a value; between firings the event simply isn't there — unlike a
State, it has no "current value" to read.

::: tip You may not need Streams yet
For most UI code, `state` + plain callbacks
(`onClick={() => x.set(…)}`) is all you need. Reach for Streams when the flow
itself is the point: debouncing input, merging sources, capturing form state at
submit, feeding requests into `resource`.

The one-sentence test: if you can **draw it on the screen**, it is a
[State](/concepts/behaviors); if you can **react to it**, it is a
Stream. The longer version:
[Stream vs State](/frp-in-plain-words#event-vs-behavior).
:::

## Creating

```ts
import { stream, never } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

const clicks = stream<MouseEvent>(); // clicks.fire() injects an occurrence
const ticks = interval(1000); // 1, 2, 3, … every second
const nothing = never<string>(); // no occurrences, ever
```

In JSX, `onClick={clicks.fire}` sends the DOM event straight into the network.

## Transforming

```ts
const ids = clicks.map((e) => (e.target as HTMLElement).id);
const lefts = clicks.filter((e) => e.button === 0);
const ones = clicks.mapTo(1);
const firstOnly = clicks.once();
const whileOpen = keys.when(isOpen); // passes only while the State is true
```

## Combining

`merge` folds **simultaneous** occurrences with an explicit function — no
"left wins by accident":

```ts
const delta = Stream.merge(increments, decrements, (a, b) => a + b);
const either = errors.or(fallbacks); // left-biased shorthand
```

## Capturing state

`at` reads a State at the event's moment; `when` filters by one:

```ts
const submitted = draft.at(submits);
```

## Becoming state

```ts
const latest = responses.hold(initial); // State: last value
const count = clicks.accum(0, (_e, n) => n + 1); // State: fold
const totals = amounts.accumE(0, (a, s) => s + a); // Stream of fold steps
```

`hold`/`accum` are **stateful**, so they need an owner — automatic inside a
component, `root(() => …)` at module level. They update at the moment's
boundary — within the occurrence's own transaction, readers see the previous
value (why that is a feature: [Transactions](/concepts/transactions)) — and
once their scope is disposed, they freeze at their last value.

State with several named transitions reads best as a cell plus reducers:

```ts
const count = state(0)
  .on(inc, (n) => n + 1)
  .on(dec, (n) => n - 1)
  .on(reset, () => 0);
```

Each reducer takes `(state, event)`; `.on` registers its process in the
current scope.

## Listening (the exit hatch)

`e.listen(handler)` runs the handler after the moment closes and returns an
unsubscribe function. It is **not** registered with the ownership tree
automatically — inside a component, wrap it:

```ts
onCleanup(e.listen(handler));
```

Prefer bindings, `at`, and folds; reach for `listen` only at the edge
of the network (logging, imperative APIs, IO — see
[perform](/guides/async)).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
