---
layout: home

hero:
  name: Continuum
  text: UI where change is data
  tagline: Starts like useState — state(0), .set, values straight in JSX. Then every change becomes an occurrence in a stream with transactional semantics, and undo, race-free search and cross-tab sync cost one fold each — not a library each.
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
  - title: Actions are a stream
    details: Route every user action through one stream and fold it — undo, persistence, cross-tab sync and race-free search are one extra fold each, not a library each. External sources — storage events, sockets — enter the same model of moments.
  - title: Updates are transactions
    details: Simultaneous changes are one atomic moment — a derived value can never observe half a state. Guaranteed by the engine's laws (classic FRP semantics), not by discipline.
  - title: No re-renders
    details: A component function runs exactly once. State is a value you drop into JSX; only the text node or attribute that depends on it updates — no hooks, no dependency arrays, no virtual DOM.
  - title: Small enough to read
    details: "A complete app — framework, state and your code — builds to 5.6 kB of gzipped JS; React + ReactDOM alone are ~8× that. Hard size budgets are enforced in CI."
---

## Try it — right here

<script setup>
const heroCounter = `import { state } from '@continuum-js/frp';

export default function Counter() {
  const count = state(0);
  // Counter never runs again. {count} binds one text node;
  // clicking patches exactly that node — no re-render.
  return (
    <button onClick={() => count.update((n) => n + 1)}>
      count: {count}
    </button>
  );
}`;
</script>

<ClientOnly>
  <Playground height="300px" :code="heroCounter" />
</ClientOnly>

Edit the code, hit **Run**, and open the **Compiled** tab to see it become a
parse-once template with a single insert hole. Then scaffold your own:

```bash
npm create continuum-js@latest my-app
```

If you know `useState`, you already know this — except `Counter` never runs
again. `{count}` binds a text node to the value; clicking patches exactly
that node.

## Then it stops being another framework

Everything above, Solid also promises. Here is the part it doesn't: **change
itself is a value.** Route every change through one stream of actions and
fold it — and features that are normally a library each become one line each:

```tsx
const actions = stream<Action>();

const todos = actions.accum(loadPersisted("todos", []), reduce); // the state
const history = actions.accum(emptyHistory, undoReduce); //       + undo
onCleanup(persist("todos", todos)); //                            + persistence
// the `storage` event dispatching into the same reducer:         + cross-tab sync
```

And because requests are a stream too, search cannot race:

```tsx
const results = resource(debounce(query.updates, 300), search);
// a stale response physically cannot overwrite a fresh one
```

The reducer never changes. The [patterns cookbook](/guides/patterns) walks
through all of these — undo, optimistic updates, race-free search — each as
a few lines over the same stream.
