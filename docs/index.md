---
layout: home

hero:
  name: Continuum
  text: Reactive UI without re-renders
  tagline: Components run once. State is a reactive value you drop straight into JSX — the framework keeps the DOM in sync, one text node at a time.
  actions:
    - theme: brand
      text: Get started
      link: /overview
    - theme: alt
      text: Coming from React?
      link: /from-react
    - theme: alt
      text: GitHub
      link: https://github.com/denislibs/continuum

features:
  - title: No re-renders
    details: A component function runs exactly once. State is a value you drop into JSX; only the text node or attribute that depends on it updates — no hooks, no dependency arrays, no virtual DOM.
  - title: Change is data — the part nobody else has
    details: User actions are a stream you fold into state. One stream of actions — and undo, persistence, cross-tab sync and race-free search are one extra fold each, not a library each.
  - title: No update bugs, guaranteed
    details: All updates are atomic — derived values can never observe a half-updated state. Backed by classic FRP semantics rather than discipline.
  - title: Small enough to read
    details: "A complete app — framework, state and your code — builds to 3.7 kB of gzipped JS; React + ReactDOM alone are ~12× that. Hard size budgets are enforced in CI."
---

## Try it

```bash
npm create continuum-js@latest my-app
```

```tsx
import { newBehavior } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

function Counter() {
  const [count, setCount] = newBehavior(0);
  return (
    <button onClick={() => setCount(count.sample() + 1)}>count: {count}</button>
  );
}

mount(document.getElementById("app")!, () => <Counter />);
```

If you know `useState`, you already know this — except `Counter` never runs
again. `{count}` binds a text node to the value; clicking patches exactly
that node.

## Then it stops being another framework

Everything above, Solid also promises. Here is the part it doesn't: **change
itself is a value.** Route every change through one stream of actions and
fold it — and features that are normally a library each become one line each:

```tsx
const [actions, dispatch] = newStream<Action>();

const todos = actions.accum(loadPersisted("todos", []), reduce); // the state
const history = actions.accum(emptyHistory, undoReduce); //       + undo
onCleanup(persist("todos", todos)); //                            + persistence
// the `storage` event dispatching into the same reducer:         + cross-tab sync
```

The reducer never changes. The [patterns cookbook](/guides/patterns) walks
through all of these — undo, optimistic updates, race-free search — each as
a few lines over the same stream.
