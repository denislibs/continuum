# Your own composables

::: tip In plain words
A composable is a plain function that creates live things — state,
subscriptions, DOM listeners — and cleans up after itself. This page is the
naming convention (`createX`, not `useX`) and the three-line anatomy every
composable shares.
:::

## Two kinds of functions, two kinds of names

**Pure helpers** take values and return values. No lifecycle, no scope — call
them anywhere, name them like any function:

```ts
const total = (items: Behavior<Item[]>) =>
  items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
```

**Composables** create living things and register cleanup (`onCleanup`,
`onMount` inside). They must be called during component build, so the name
carries a warning label: the **`create` prefix**.

```ts
const size = createWindowSize(); // "create" = call once, get live wiring
```

## Why `createX` and not `useX`

React's `use*` prefix exists to enforce the Rules of Hooks: fixed call
order, top level only, re-run on every render. **None of those rules exist
here** — a component runs once, composables may be called in an `if`, in a
loop, in any order. Borrowing the `use*` prefix would borrow the wrong
mental model along with it. `create` says exactly what happens: called once,
creates something alive.

(This matches Solid's convention, for the same reason.)

## Anatomy: create → bridge → clean up

Every composable is the same three moves:

```ts
import { newBehavior, type Behavior } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";

export function createWindowSize(): Behavior<{ w: number; h: number }> {
  // 1. create the live value
  const [size, setSize] = newBehavior({ w: innerWidth, h: innerHeight });

  // 2. bridge the outside world into the network (at the boundary!)
  const onResize = () => setSize({ w: innerWidth, h: innerHeight });
  window.addEventListener("resize", onResize);

  // 3. register the teardown — the ownership tree calls it on unmount
  onCleanup(() => window.removeEventListener("resize", onResize));

  return size;
}
```

Use it like any value:

```tsx
function StatusBar() {
  const size = createWindowSize();
  return <footer>{size.map((s) => `${s.w}×${s.h}`)}</footer>;
}
```

A realistic second example — the persisted store from the
[patterns](/guides/patterns) page, packaged:

```ts
import { newEvent } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";
import { persist, loadPersisted } from "@continuum-js/std";

export function createPersistedTodos(key: string) {
  const [actions, dispatch] = newEvent<Action>();
  const todos = actions.accum<Todo[]>(loadPersisted(key, []), reduce);
  onCleanup(persist(key, todos));
  return { todos, dispatch };
}
```

The component shrinks to `const { todos, dispatch } = createPersistedTodos("todos")`.

## The one rule

**Call a composable synchronously during component build** (or inside
`root()`/`scope()`), because that is when an owner exists to attach the
cleanup to. Calling one from a handler or a `setTimeout` throws a teaching
error — there would be no one to ever run the teardown.

That is the whole discipline. No call-order requirements, no "top level
only", no dependency arrays. Conditionals are fine:

```ts
function Widget(props: { live: boolean }) {
  // perfectly legal — this is NOT React
  const data = props.live ? createPolling("/api") : constant(null);
  ...
}
```

## Testing a composable

`root()` gives you an owner outside any component:

```ts
import { root } from "@continuum-js/dom";

test("createWindowSize tracks resizes", () => {
  root((dispose) => {
    const size = createWindowSize();
    window.dispatchEvent(new Event("resize"));
    expect(size.sample().w).toBe(window.innerWidth);
    dispose(); // runs the composable's cleanup
  });
});
```
