# Components

::: tip In plain words
A component is a function that assembles its piece of the page once and hands it over. No repaints: everything live inside updates through bound values.
:::

A component is a plain function that returns DOM. It runs **exactly once**
per appearance in the tree — it is a _constructor of a live subtree_, not a
render function.

```tsx
function Greeting(props: { name: Wire<string> }) {
  return <p>Hello, {props.name}!</p>;
}
```

There is no instance, no lifecycle object, no re-invocation. Everything the
component sets up — bindings, subscriptions, timers — lives until its
subtree is disposed (see [Ownership](/concepts/ownership)).

## Props

Props are read once, in the body. The convention that keeps components
honest:

- **changes over time** → take a `Wire<T>`;
- **fixed for the subtree's lifetime** → take a plain `T`.

```tsx
function Price(props: { amount: Wire<number>; currency: string }) {
  return (
    <span>
      {props.amount.map((a) => a.toFixed(2))} {props.currency}
    </span>
  );
}
```

There is no "props changed" mechanism: if a parent wants to change what a
child shows, it hands the child a Wire. Destructuring props is safe —
they are ordinary values.

## Children

`children` is whatever JSX puts there: nodes, strings, Wires, arrays, or
a function (render prop) if your component wants one:

```tsx
function Card(props: { title: string; children?: Child }) {
  return (
    <section class="card">
      <h3>{props.title}</h3>
      {props.children}
    </section>
  );
}
```

## Elements are values

JSX evaluates to real DOM nodes immediately. That makes patterns that need
refs in React trivial:

```tsx
const input = (<input />) as HTMLInputElement;
onMount(() => input.focus());
return <form>{input}</form>;
```

For elements buried deep in JSX there is `ref={fn}` / `ref={obj}` — it fires
at creation time.

## No rules

Because nothing re-runs, component helpers are ordinary functions. Create
state in a condition, in a loop, at module level (stateful values need a
`root(...)` owner there — see [Ownership](/concepts/ownership)); extract
"custom hooks" as functions returning Wires/Streams — no ordering rules, no
lint plugin.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
