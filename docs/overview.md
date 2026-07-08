# Overview

Continuum is a UI framework where **components run once** and state keeps
the DOM in sync by itself.

## The 30-second version

```tsx
import { newBehavior } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

function Counter() {
  const [count, setCount] = newBehavior(0);
  const double = count.map((n) => n * 2);
  return (
    <div>
      <button onClick={() => setCount(count.sample() + 1)}>+1</button>
      <p>
        count: {count}, double: {double}
      </p>
    </div>
  );
}

mount(document.getElementById("app")!, () => <Counter />);
```

Three moves, and they are the whole core model:

1. **Create state** — `newBehavior(0)` gives you a reactive value and a
   setter. Like `useState`, but the component never re-runs.
2. **Derive** — `count.map(n => n * 2)` is a value computed from another
   one. No dependency array: `double` depends on `count` because it is
   built from it.
3. **Bind** — putting a value in JSX (`{count}`, `class={cls}`) wires that
   exact text node or attribute to it. Change the value, and only that node
   updates.

No hooks, no re-renders, no memoization, no virtual DOM.

## The part that makes it Continuum

Fine-grained rendering you can also get elsewhere. What you can't get
elsewhere: here **change itself is a value**. A `Stream` is the history of
something happening — clicks, submitted forms, server responses — and state
is a _fold_ over that history:

```tsx
const [actions, dispatch] = newStream<Action>();
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

The rule of thumb for which tool to reach for: **no history — `newBehavior`;
a history worth keeping — a stream.** `newBehavior` is itself just sugar over
`newStream` + `hold`: perfect for form fields, toggles and everything you
simply overwrite. The moment you catch yourself wanting "how did this value
get here" — undo, audit, sync — the stream form is the same state with its
story attached.

## Why trust it

Under the plain surface sits a rigorous engine — classic FRP (the
Sodium-style discrete branch). What that buys you in practice:

- **Atomic updates.** When one change fans out to many derived values,
  everything updates as a single step. A derived value can never observe a
  half-updated state — a whole class of subtle UI bugs is impossible, not
  just unlikely.
- **Honest async.** IO results and errors come back as ordinary data;
  response races are solved once, in the library (`resource`,
  last-request-wins).
- **Deterministic cleanup.** Everything a component creates is disposed
  with its subtree — subscriptions, timers, portals.

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
   [Thinking in Behaviors and Streams](/tutorial/thinking-in-frp).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
