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
  - title: State that just updates
    details: Create a value, put it in JSX, change it from a handler. No hooks, no dependency arrays, no memoization — derived values are plain function calls.
  - title: No re-renders
    details: A component function runs exactly once. Only the text node or attribute that depends on a value updates — no virtual DOM, no diffing.
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
