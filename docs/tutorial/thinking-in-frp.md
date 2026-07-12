# Thinking in States and Streams

::: info The engine room
You don't need this page to build with Continuum — the
[Concepts](/concepts/components) cover everyday use. Read it when you want
to know **why** the framework can promise "no update bugs": the model
underneath is classic FRP, and it is genuinely elegant.
:::

Continuum is a classic-FRP framework. Not "reactivity" in the signals or
proxy-wrapper sense: two precisely defined abstractions of time and hard
guarantees about how they compose. This tutorial teaches you to **think** in
the model; the operational details (ranks, transaction phases, how `flatten`
works) are covered in
[FRP-MODEL](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).

## The problem: state as synchronization

In handler-centric code, state is a set of variables that handlers keep
_in sync_ with each other:

```ts
let count = 0;
button.addEventListener("click", () => {
  count++;
  label.textContent = String(count); // don't forget!
  submit.disabled = count === 0; //     don't forget this either!
});
```

Every new place that depends on `count` is one more line in every handler
that changes it. Miss one and the UI drifts out of sync. React solves this by
re-running: "state changed — re-render the subtree and diff". Continuum
solves it differently: **a dependency is declared once, at build time**, and
the network maintains it from then on.

## Two types of time

The whole model is two types:

- **`State<A>`** — a value that _exists at every moment in time_.
  Denotationally `Time → A`: you can't ask it "did it arrive?", only "what is
  it now?". The mouse position, the text of an input, the current count, the
  URL.
- **`Stream<A>`** — [discrete occurrences](/glossary#occurrence): at some moments something happens
  carrying an `A`; at all other moments, nothing does. A click, a keypress, a
  server response, a timer tick.

The first question when designing any feature: **is this a value or an
event?**

| You are asking yourself                          | Type     |
| ------------------------------------------------ | -------- |
| "What is _currently_ typed / selected / loaded?" | `State`  |
| "_Did_ a click / submit / response happen?"      | `Stream` |

Choosing wrong always takes revenge: an event stuffed into a state (a
`justClicked` flag) needs manual resetting; a value smeared across events
needs manual synchronization — right back where we started.

## The network is built, not executed

A Continuum component is a plain function that runs **once** and builds two
things: an FRP network and DOM wired to it.

```tsx
import { stream } from "@continuum-js/frp";

function Counter() {
  const clicks = stream<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  const parity = count.map((n) => (n % 2 === 0 ? "even" : "odd"));
  return (
    <button onClick={clicks.fire}>
      count: {count} ({parity})
    </button>
  );
}
```

Read this not as "code that runs on click" but as a **circuit**:
`clicks → accum → count → map → parity`, plus two text nodes wired to `count`
and `parity`. A click propagates through the circuit; the `Counter` function
is never called again.

Dependencies aren't listed in an array — they _are_ the structure of the
expression. `parity` is built from `count`, therefore it depends on it.
Forgetting a dependency is syntactically impossible.

Multiple sources combine explicitly:

```ts
import { combine } from "@continuum-js/frp";

const total = combine(price, qty, (p, q) => p * q);
```

## A moment in time: honest simultaneity

All updates happen inside **transactions** — atomic moments of logical time.
If two branches derive from one event and share a descendant (a "diamond"),
the descendant recomputes **once**, seeing both branches already updated:

```ts
const doubled = count.map((n) => n * 2);
const squared = count.map((n) => n * n);
const sum = combine(doubled, squared, (d, s) => d + s);
// on count: 2 → 3, sum goes 8 → 15 in one step;
// an intermediate "6 + 4" does not exist at any moment
```

That is what "glitch-free" means: half-updated state isn't merely rarely
observed — it **does not exist in the model**.

Two events in the same moment are honest simultaneity too. `Stream.merge`
takes a coalescing function and folds simultaneous occurrences into one:

```ts
const either = Stream.merge(left, right, (a, b) => a + b);
```

A state's `updates` obeys the same discipline: however many writes land in a
moment, a state delivers exactly **one** coalesced occurrence per moment.

## Why `hold` is delayed: the past is available, the present is not

`e.hold(init)` turns an event into a state: "the latest value of `e`". The
key rule: **a state updates at the moment's boundary**. Within the very
moment an occurrence arrives, `hold` still shows the _old_ value.

Why? So that "the current value" is well-defined even when you look at it
from the event that is changing it:

```ts
const submit = stream<void>();
const draft = input.hold(""); // the field's text

// which text do we submit? the one AT THE MOMENT of submit:
const submitted = draft.at(submit);
```

If `hold` updated instantly, "what does `at` see when `input` and
`submit` arrive simultaneously?" would depend on subscription order — a
classic race. With delayed `hold` the answer is defined mathematically:
`at` sees the value _before_ this moment. The past is stable; the present
is still forming.

## `at` instead of "read it in the handler"

The handler-centric habit is "I'll read whatever I need from variables inside
the callback". The FRP equivalent is `at`: an event _captures_ a
state's value at its own moment:

```ts
// "on submit, take the text and clear the field"
const submitted = draft.at(submitClicks);
```

The difference from reading in a callback is the same as above: `at`
has an exact simultaneity semantics; "read it in the handler" has execution
order.

## Rendering: the DOM is wired to the network

A state in JSX is a binding, not a value:

- `{count}` as a child — a text node patched on change;
- `class={cls}` with a state — an attribute that updates itself;
- `bindInput(b, set)` — a two-way input binding.

As long as only _values_ change, the DOM structure stands still. When the
_structure_ must change, you say so explicitly:

```tsx
import { Show, Each } from "@continuum-js/dom";

<Show when={user} fallback={() => <Login />}>
  {(u) => <Profile user={u} />}
</Show>

<Each each={todos} by={(t) => t.id}>
  {(t) => <TodoRow todo={t} />}
</Each>
```

`Show` rebuilds its subtree only when the condition's _truthiness_ flips.
`Each` reuses rows by key and reorders them with a minimal number of moves; a
row re-renders only if its key disappeared and reappeared. The granularity
rule is simple: **values are bindings, structure is `Show`/`Each`/`dyn`**.

## Ownership: whoever builds it, cleans it up

Everything a component creates — subscriptions, timers, listeners — registers
in the _ownership tree_. When a subtree goes away (a `Show` flipped, an
`Each` row was removed, the app unmounted), its `onCleanup` callbacks run in
a cascade:

```tsx
import { onCleanup, onMount } from "@continuum-js/dom";

function Clock() {
  const tick = stream<number>();
  const id = setInterval(() => tick.fire(Date.now()), 1000);
  onCleanup(() => clearInterval(id));

  const input = (<input />) as HTMLInputElement;
  onMount(() => input.focus()); // the nodes are already in the document

  return (
    <div>
      {tick.hold(Date.now()).map((t) => new Date(t).toLocaleTimeString())}
      {input}
    </div>
  );
}
```

State belongs to this tree too: the `hold` here is owned by the component's
scope, and when the subtree is disposed it detaches — the state freezes at
its final value. Pure derivations (`map`, `combine`) need no owner at all:
they are formulas, attaching when listened to and sleeping when not.

`onMount` mirrors `onCleanup`: it runs once, when the scope's nodes are
inserted into the DOM (focus, measurements, third-party libraries). Child
scopes mount before their parents. And these are ordinary functions — no
rules of hooks: call them in conditions, loops, helpers.

## Async: IO as data

The network is pure; the world enters through explicit hatches. `perform`
turns an event of requests into an event of results, where an error is a
value, not an exception:

```ts
import { perform, type Result } from "@continuum-js/frp";

const results = perform(queries, async (q): Promise<Page> => fetchPage(q));
// Stream<Result<unknown, Page>> — { ok: true, value } | { ok: false, error }
```

For the typical "load and show" there is `resource` in `@continuum-js/std`:
a state with `idle | loading | ok | error` states rendered by a plain
`dyn` — no Suspense machinery, it's just data.

## Where to go next

- [FRP-MODEL](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md) —
  the operational deep dive: transaction phases, ranks, `flatten`, continuous
  time, with references to _Functional Reactive Programming_
  (Blackheath & Jones).
- [From React](/from-react) — the correspondence table and paired examples.
- `npm create continuum-js@latest` — a project scaffold to experiment with as
  you read.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
