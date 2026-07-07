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
| `@continuum-js/frp`    | reactive values and events, the update engine     | ~1.8 kB           |
| `@continuum-js/dom`    | JSX renderer, `Show`/`Each`, lifecycle, context   | ~3.7 kB incl. frp |
| `@continuum-js/std`    | `debounce`, `interval`, `resource`, …             | ~2 kB incl. frp   |
| `@continuum-js/router` | nested routes, guards, lazy code splitting        | ~3.9 kB incl. all |
| `@continuum-js/test`   | `render`/`fire`/`type`/`flush` helpers for vitest | dev-only          |

## Where to go next

0. New to reactivity itself? [What is FRP — in plain words](/frp-in-plain-words).
1. [Quick start](/quick-start) — a running app in one command.
2. [Examples](/examples) — small complete apps, runnable in the browser.
3. [Concepts](/concepts/components) — one idea per page.
4. [From React](/from-react) — a construct-by-construct migration map.
5. When you're curious about the engine:
   [Thinking in Behaviors and Events](/tutorial/thinking-in-frp).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
