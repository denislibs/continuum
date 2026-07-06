# Events

`Event<A>` is a stream of **discrete occurrences**: at some moments something
happens carrying an `A`; between them, nothing exists. Denotationally —
`[(Time, A)]`.

## Creating

```ts
import { newEvent, never } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

const [clicks, fire] = newEvent<MouseEvent>(); // fire() injects an occurrence
const ticks = interval(1000); // 1, 2, 3, … every second
const nothing = never<string>(); // no occurrences, ever
```

In JSX, `onClick={fire}` sends the DOM event straight into the network.

## Transforming

```ts
const ids = clicks.map((e) => (e.target as HTMLElement).id);
const lefts = clicks.filter((e) => e.button === 0);
const ones = clicks.mapTo(1);
const firstOnly = clicks.once();
const whileOpen = keys.gate(isOpen); // passes only while the Behavior is true
```

## Combining

`merge` folds **simultaneous** occurrences with an explicit function — no
"left wins by accident":

```ts
const delta = Event.merge(increments, decrements, (a, b) => a + b);
const either = errors.orElse(fallbacks); // left-biased shorthand
```

## Capturing state

`snapshot` reads a Behavior at the event's moment; `gate` filters by one:

```ts
const submitted = submits.snapshot(draft, (_e, text) => text);
```

## Becoming state

```ts
const latest = responses.hold(initial); // Behavior: last value
const count = clicks.accum(0, (_e, n) => n + 1); // Behavior: fold
const totals = amounts.accumE(0, (a, s) => s + a); // Event of fold steps
```

`hold`/`accum` update at the moment's boundary — within the occurrence's own
transaction, readers see the previous value. Why that is a feature and not a
bug: [Transactions](/concepts/transactions).

## Listening (the exit hatch)

`e.listen(handler)` runs the handler after the moment closes and returns an
unsubscribe function. It is **not** registered with the ownership tree
automatically — inside a component, wrap it:

```ts
onCleanup(e.listen(handler));
```

Prefer bindings, `snapshot`, and folds; reach for `listen` only at the edge
of the network (logging, imperative APIs, IO — see
[perform](/guides/async)).
