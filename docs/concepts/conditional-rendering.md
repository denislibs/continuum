# Conditional rendering

::: tip In plain words
How to show or hide a piece of the page on a condition — and why these are components (Show, Dynamic) rather than a plain ternary.
:::

Values in JSX are bindings — they patch text and attributes in place. When
the **structure** of the DOM must change, you declare a dynamic region.

## `<Show>`

```tsx
import { Show } from "@continuum-js/dom";

<Show when={user} fallback={() => <Login />}>
  {(u) => <Profile user={u} />}
</Show>;
```

`when` takes a `Wire<T | null | undefined | false>`. The subtree is
rebuilt only when **truthiness flips** — updates of an already-truthy value
do not rebuild anything (the child receives the value as of the flip; pass
Wires inside for live parts).

The functional form for JSX-free code is `when(cond, then, else?)` with a
`Wire<boolean>`.

## `<Dynamic>` — switch on a value

When there are more than two branches, key the region by the value itself:

```tsx
import { Dynamic } from "@continuum-js/dom";

<Dynamic value={state}>
  {(s) =>
    s.status === "loading" ? (
      <Spinner />
    ) : s.status === "error" ? (
      <ErrorBox error={s.error} />
    ) : s.status === "ok" ? (
      <Profile user={s.value} />
    ) : null
  }
</Dynamic>;
```

The region rebuilds when `value` changes (`Object.is`). To avoid rebuilding
on irrelevant changes, narrow the Wire first and de-duplicate:

```ts
import { distinctB } from "@continuum-js/std";

const status = distinctB(state.map((s) => s.status));
```

## `dyn` — the primitive

`Show` and `Dynamic` are sugar over `dyn(wire, render)`: a region
bounded by comment markers that disposes the old subtree and builds the new
one when the wire's value changes. Reach for `dyn` directly when
building your own control-flow component — the router's `Outlet` is exactly
that, keyed by route identity.

## `<Portal>`

Structure that must render elsewhere (modals, tooltips) while belonging to
the component's lifetime:

```tsx
<Portal mount={document.body}>
  <div class="modal">…</div>
</Portal>
```

The content is removed and disposed with the owning subtree, wherever it was
mounted.

## `<Catch>` — error boundary {#catch}

A throw while building a piece of the page should not kill the whole app.
`<Catch>` shows a fallback instead and lets the user retry:

```tsx
import { Catch } from "@continuum-js/dom";

<Catch
  fallback={(error, reset) => (
    <div class="error">
      Something broke: {String(error)}
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  {() => <RiskyWidget />}
</Catch>;
```

- **Children must be a thunk** (`{() => …}`) — eager JSX would run (and
  throw) before `Catch` gets control.
- Caught: a throw while building the children, and a throw during any
  nested `Show`/`Dynamic`/`dyn` rebuild inside the boundary. The failed
  subtree's ownership is disposed — no leaked subscriptions or timers.
- `reset` rebuilds the children from scratch; an error thrown by the
  fallback itself escalates to the next boundary up.
- Not caught: throws inside binding `map` functions (keep them pure).
  Async/IO errors never throw at all — `perform` and `resource` deliver
  them as data (`Result`, `Async`), which you render like any value.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
