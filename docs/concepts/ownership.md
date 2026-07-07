# Ownership and lifecycle

::: tip In plain words
Everything a component creates — timers, subscriptions — cleans itself up when its piece of the page goes away. This page explains how, plus the two callbacks: onMount and onCleanup.
:::

Everything a component creates — subscriptions, timers, nested regions —
registers in the **ownership tree**. When a subtree goes away, its resources
are released in a cascade, children first. That is the entire lifecycle
model: no mount/update/unmount phases, just _build once_ and _dispose once_.

## Where subtrees come and go

- `mount(container, view)` creates the root owner; the returned function
  disposes everything.
- A `dyn`/`Show`/`Dynamic` region disposes the old subtree before building
  the new one.
- An `<Each>` row is disposed when its key leaves the list.

## `onCleanup`

Registers teardown in the current owner:

```tsx
import { onCleanup } from "@continuum-js/dom";

function Ticker() {
  const id = setInterval(poll, 5000);
  onCleanup(() => clearInterval(id));
  return <span>…</span>;
}
```

What cleans up **automatically**: JSX bindings (`{b}`, `class={b}`), event
handler props (`onClick`), `animationFrames()`. What needs an **explicit**
`onCleanup`: raw `e.listen(...)` (pass its unsubscribe), `interval`/`delay`
events (`onCleanup(() => ticks.dispose())`), and anything imperative you set
up yourself.

## `onMount`

The component body runs _before_ its nodes are inserted into the document.
When an effect needs a live element — focus, measurement, a third-party
widget — register it with `onMount`:

```tsx
import { onMount } from "@continuum-js/dom";

function SearchBox() {
  const input = (<input />) as HTMLInputElement;
  onMount(() => input.focus());
  return input;
}
```

`onMount` fires once, right after the scope's nodes are inserted — at
`mount`, on a `dyn`/`Show` switch, on a new `Each` row. Child scopes mount
before their parents. A subtree replaced before it was ever inserted never
fires its `onMount`.

Both are ordinary functions — call them in conditions, loops, and helpers.

## Roots and scopes by hand

`root(fn)` creates a standalone owner (that is what `mount` uses);
`scope(fn)` creates a child scope with its own dispose handle. You need them
only when building custom machinery — for example, batching work outside the
DOM tree that should still die with a component.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
