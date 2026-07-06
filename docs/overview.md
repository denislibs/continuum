# Overview

Continuum is a UI framework built on **classic FRP** — the discrete branch of
Functional Reactive Programming (Sodium-style), put to work for the DOM.

## What it is

Two abstractions model everything that happens in a UI:

- **`Behavior<A>`** — a value that exists at every moment: the text of an
  input, the current user, the URL.
- **`Event<A>`** — discrete occurrences: clicks, responses, ticks.

Components are plain functions that run **once**. They build an FRP network
and DOM wired to it; after that, updates are values propagating through the
network into individual text nodes and attributes. There is no re-rendering,
no virtual DOM, no dependency tracking at runtime — the dependency graph _is_
the program you wrote.

```tsx
import { newEvent } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

function Counter() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}

mount(document.getElementById("app")!, () => <Counter />);
```

## Why it's different

**Transactions.** Every update runs in an atomic moment of logical time.
Derived values never observe half-updated state ("glitches") — not because
they are batched as an optimization, but because simultaneity is part of the
model.

**Honest async.** IO enters the network as data: an error is a `Result`
branch, a loading state is a value. Response races are solved once, in the
library, not with a `cancelled` flag per effect.

**Small.** The whole stack — core, DOM renderer, std utilities, router — is
under 8 kB brotli, with hard size budgets enforced in CI.

## The packages

| Package                | What's inside                                                                | Size (brotli)     |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------- |
| `@continuum-js/frp`    | Behaviors, Events, transactions, `perform`, continuous time                  | ~1.8 kB           |
| `@continuum-js/dom`    | JSX renderer, `dyn`/`Show`/`Each`, ownership, context, `onMount`/`onCleanup` | ~3.7 kB incl. frp |
| `@continuum-js/std`    | `debounce`/`throttle`/`interval`, `resource`, `distinctB`, …                 | ~2 kB incl. frp   |
| `@continuum-js/router` | URL as a Behavior, nested routes, guards, `lazy` code splitting              | ~3.9 kB incl. all |
| `@continuum-js/test`   | `render`/`fire`/`type`/`flush` helpers for vitest                            | dev-only          |

## Where to go next

1. [Quick start](/quick-start) — a running app in one command.
2. [Thinking in Behaviors and Events](/tutorial/thinking-in-frp) — the
   mental model, in 15 minutes.
3. [Concepts](/concepts/components) — one idea per page.
4. [From React](/from-react) — if you're migrating habits.
