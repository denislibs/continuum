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

`when` takes a `Behavior<T | null | undefined | false>`. The subtree is
rebuilt only when **truthiness flips** — updates of an already-truthy value
do not rebuild anything (the child receives the value as of the flip; pass
Behaviors inside for live parts).

The functional form for JSX-free code is `when(cond, then, else?)` with a
`Behavior<boolean>`.

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
on irrelevant changes, narrow the Behavior first and de-duplicate:

```ts
import { distinctB } from "@continuum-js/std";

const status = distinctB(state.map((s) => s.status));
```

## `dyn` — the primitive

`Show` and `Dynamic` are sugar over `dyn(behavior, render)`: a region
bounded by comment markers that disposes the old subtree and builds the new
one when the behavior's value changes. Reach for `dyn` directly when
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

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
