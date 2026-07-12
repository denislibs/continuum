# Overview

Continuum is a UI framework where **components run once** and state keeps
the DOM in sync by itself.

## How it compares

Continuum is **Solid-class on speed and memory, in a fraction of the bytes**.
The whole counter below — framework, reactivity, renderer and app code —
ships as **5.6 kB of gzipped JavaScript**.

### Bundle size (gzipped, a full counter app)

| Continuum     | Solid | React + ReactDOM |
| ------------- | ----- | ---------------- |
| **5.6 kB** ✅ | ~7 kB | ~45 kB (~8×)     |

### Memory — 10,000 rows, heap after GC

Measured on the js-framework-benchmark table (`npm run bench:mem`, Chromium,
median of 3):

| Heap after GC  | Continuum      | Solid   |
| -------------- | -------------- | ------- |
| 10,000 rows    | **9.7 MB** ✅  | 14.1 MB |
| after clearing | 1.96 MB        | 1.94 MB |
| DOM listeners  | 27 (delegated) | 27      |

**−32 % heap** at 10k rows, and clearing returns to baseline — no leak, parity
with Solid.

### Speed — pure JS per operation (`script ms`, lower is better)

Same table, our compiler output vs Solid's (`npm run bench`, median of 10):

| Operation              | Continuum  | Solid   |              |
| ---------------------- | ---------- | ------- | ------------ |
| create 1,000 rows      | 4.2        | 3.4     |              |
| create 10,000 rows     | 32.9       | 27.8    | ~1.2×        |
| **select row**         | **0.10**   | 0.20    | 2× faster ✅ |
| swap rows              | 0.80       | 0.70    |              |
| remove row             | 0.85       | 0.60    |              |
| **clear 1,000 rows**   | **2.65**   | 2.85    | faster ✅    |
| GC garbage, create 10k | **8.4 MB** | 13.8 MB | −39 % ✅     |

Continuum matches Solid on the operations that dominate real apps — updates,
select, swap, clear — while allocating **~40 % less garbage**, and trails only
~1.2× on bulk row creation. React is a different class entirely: a virtual DOM
that re-renders and diffs, several times slower than Solid-class frameworks on
the same table (see [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/))
and ~8× the download.

### Engine cost, per operation

The transactional guarantees are essentially free. Measured in isolated Node
processes (`npm run bench:core`, `@continuum-js/frp`):

| Operation                    | Time    | Garbage |
| ---------------------------- | ------- | ------- |
| read a state (`.sample()`)   | 0.5 ns  | 0 B     |
| update a state (`.set()`)    | ~35 ns  | ~1 B    |
| fire a stream occurrence     | ~23 ns  | ~2 B    |
| batch of 5 coalesced updates | ~295 ns | ~6 B    |

A state update runs a full transaction — coalescing, rank-ordered propagation,
the `hold` boundary — in ~35 nanoseconds and allocates about **one byte** of
garbage. Reading is a plain field access.

::: tip Reproduce it yourself
`npm run bench` (speed), `npm run bench:mem` (memory), `npm run bench:core`
(engine ns/op), `npm run size` (bytes) — one machine, one harness, all
frameworks through the same timing.
:::

And Continuum gives you something neither offers: **change itself is a value**
— undo, race-free search and cross-tab sync become [one fold
each](/guides/patterns), not a library each.

## The 30-second version

```tsx
import { state } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

function Counter() {
  const count = state(0);
  const double = count.map((n) => n * 2);
  return (
    <div>
      <button onClick={() => count.update((n) => n + 1)}>+1</button>
      <p>
        count: {count}, double: {double}
      </p>
    </div>
  );
}

mount(document.getElementById("app")!, () => <Counter />);
```

Three moves, and they are the whole core model:

1. **Create state** — `state(0)` gives you a reactive value with a `.set`
   method. Like `useState`, but the component never re-runs. The component's
   scope owns the state: unmount the component and the state goes with it.
2. **Derive** — `count.map(n => n * 2)` is a formula computed from another
   value. No dependency array: `double` depends on `count` because it is
   built from it.
3. **Bind** — putting a value in JSX (`{count}`, `class={cls}`) binds that
   exact text node or attribute to it. Change the value, and only that node
   updates.

No hooks, no re-renders, no memoization, no virtual DOM.

## The part that makes it Continuum

Fine-grained rendering you can also get elsewhere. What you can't get
elsewhere: here **change itself is a value**. A `Stream` is the history of
something happening — clicks, submitted forms, server responses — and state
is a _fold_ over that history:

```tsx
const actions = stream<Action>();
const todos = actions.accum([], reduce); // state = everything that happened, folded
```

Why bother? Because once every change is routed through one stream, the
features that usually cost a library each cost **one more fold** each:

- **Undo/redo** — fold the same actions into a history instead
  ([recipe](/guides/patterns#2-undo-redo));
- **Persistence** — mirror the folded value into storage
  ([recipe](/guides/patterns#21-persistence-persist-loadpersisted));
- **Cross-tab sync** — the `storage` event is just one more dispatcher into
  the same reducer;
- **Race-free search** — requests are a stream, so "last request wins" is
  solved once, in the library
  ([recipe](/guides/patterns#14-race-free-search-resource)).

### Where it pays off

Two of these in full — each snippet is the entire feature, not an excerpt.

**Undo in ten lines.** Fold the same actions into a history instead of a
plain value; the reducer doesn't change:

```tsx
import { stream } from "@continuum-js/frp";

type Hist = { past: Todo[][]; present: Todo[] };

const actions = stream<Action>();
const history = actions.accum<Hist>({ past: [], present: [] }, (a, h) =>
  a.type === "undo"
    ? h.past.length
      ? { past: h.past.slice(0, -1), present: h.past.at(-1)! }
      : h
    : { past: [...h.past, h.present], present: reduce(a, h.present) },
);
const todos = history.map((h) => h.present);
const canUndo = history.map((h) => h.past.length > 0);
```

**Search that cannot race.** Keystrokes are a stream: debounce it, feed it
to `resource` — a stale response physically cannot overwrite a fresh one,
because last-request-wins is solved once, inside the library:

```tsx
import { state } from "@continuum-js/frp";
import { debounce, resource } from "@continuum-js/std";

const query = state("");
const results = resource(debounce(query.updates, 300), (q) =>
  fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
);
// State<Async<T>>: idle → loading → ok | error
```

The rule of thumb for which tool to reach for: **no history — `state`;
a history worth keeping — a stream.** `state` is itself just sugar over
`stream` + `hold`: perfect for form fields, toggles and everything you
simply overwrite. The moment you catch yourself wanting "how did this value
get here" — undo, audit, sync — the stream form is the same state with its
story attached.

And when one value has several sources, don't scatter `.set` calls — declare
the transitions on the state itself:

```tsx
const count = state(0)
  .on(inc, (n) => n + 1)
  .on(dec, (n) => n - 1)
  .on(reset, () => 0);
```

Each `.on(event, reducer)` is a `(state, event) => state` step, registered
as a process in the current scope. The single-source counter above could be
a fold too — `clicks.accum(0, (_e, n) => n + 1)` — but `state(0).on(…)` is the
idiomatic form the moment sources multiply.

## Why trust it

Under the plain surface sits a rigorous engine — classic FRP (the
Sodium-style discrete branch). What that buys you in practice:

- **Atomic updates.** When one change fans out to many derived values,
  everything updates as a single step. A derived value can never observe a
  half-updated state — a whole class of subtle UI bugs is impossible, not
  just unlikely. Several sources changing together is one `batch`:

  ```tsx
  batch(() => {
    price.set(99);
    currency.set("EUR");
  });
  // every formula over both updates once — "99 USD" is never visible
  ```

- **Honest async.** IO results and errors come back as ordinary data;
  response races are solved once, in the library (`resource`,
  last-request-wins).
- **Deterministic cleanup.** Values are formulas; state and effects belong
  to a scope. Everything a component creates is owned by its scope and
  disposed with its subtree — subscriptions, timers, portals.

You don't need the theory to use the framework — it's there when you want
to know _why_ it works: see [the deep dive](/tutorial/thinking-in-frp).

## The packages

| Package                | What's inside                                     | Size (brotli)     |
| ---------------------- | ------------------------------------------------- | ----------------- |
| `@continuum-js/frp`    | reactive values and streams, the update engine    | ~2.3 kB           |
| `@continuum-js/dom`    | JSX renderer, `Show`/`Each`, lifecycle, context   | ~4.5 kB incl. frp |
| `@continuum-js/std`    | `debounce`, `resource`, `persist`, …              | ~2.6 kB incl. frp |
| `@continuum-js/router` | nested routes, guards, lazy code splitting        | ~4.6 kB incl. all |
| `@continuum-js/test`   | `render`/`fire`/`type`/`flush` helpers for vitest | dev-only          |

## Where to go next

0. New to reactivity itself? [What is FRP — in plain words](/frp-in-plain-words).
1. [Quick start](/quick-start) — a running app in one command.
2. [Examples](/examples) — small complete apps, runnable in the browser.
3. [Concepts](/concepts/components) — one idea per page.
4. [From React](/from-react) — a construct-by-construct migration map.
5. When you're curious about the engine:
   [Thinking in States and Streams](/tutorial/thinking-in-frp).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
