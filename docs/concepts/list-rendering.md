# List rendering

::: tip In plain words
Rendering changing lists: Each recognizes rows by key and moves ready-made DOM nodes instead of repainting the list.
:::

## `<Each>`: the key is the row's identity

```tsx
import { Each } from "@continuum-js/dom";

<ul>
  <Each each={todos} by={(t) => t.id}>
    {(t) => <TodoRow todo={t} />}
  </Each>
</ul>;
```

`by` plays the role of React's `key`, with a stronger consequence: there is
**one live subtree per key**. As long as a key is present in the list, its
row is never re-rendered — at all. When the order changes, DOM nodes are
reordered with a minimal number of moves (the LIS algorithm), and focus is
preserved.

What follows from this:

- a row is built once → `render` receives the item _as of the key's
  appearance_. If the row's content must change, pass a State inside
  (see below);
- duplicate keys are ignored (the first wins) — keys must be unique;
- removing a key destroys the row's subtree in a cascade: subscriptions,
  timers, nested regions — the ownership tree cleans it all up.

## Row content that changes

If list items update "in place" (same id, different fields), take the
**second** render argument: `row` is a `State<T>` that follows the item
under the same key across list updates.

```tsx
function TodoRow(props: { todo: State<Todo> }) {
  const done = props.todo.map((t) => t.done);
  const text = props.todo.map((t) => t.text);
  return <li class={done.map((d) => (d ? "done" : ""))}>{text}</li>;
}

<Each each={todos} by={(t) => t.id}>
  {(_t, row) => <TodoRow todo={row} />}
</Each>;
```

The row is built once, while its text and class are live bindings. A field
update patches a text node without touching the structure. The first
argument is the item as of the row's creation — a snapshot; a render that
only uses it (one parameter) allocates no row state at all.

## Filtering and sorting are derived lists

A filtered list is a `map` over the source, not separate state:

```tsx
const visible = combine(todos, filter, (xs, f) =>
  f === "all" ? xs : xs.filter((t) => t.done === (f === "done")),
);

<Each each={visible} by={(t) => t.id}>{(t) => <TodoRow …/>}</Each>;
```

Switching the filter changes the set of keys; rows whose keys survive move
without a re-render.

## When you don't need `<Each>`

A static list (data never changes during the subtree's life) is a plain
`array.map` right in JSX:

```tsx
<ul>
  {items.map((i) => (
    <li>{i.name}</li>
  ))}
</ul>
```

`<Each>` is only for lists that are States.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
