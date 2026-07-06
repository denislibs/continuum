---
layout: home

hero:
  name: Continuum
  text: Classic FRP for the DOM
  tagline: Behaviors, Events, and fine-grained rendering. Components run once — there are no re-renders to fight.
  actions:
    - theme: brand
      text: Tutorial
      link: /tutorial/thinking-in-frp
    - theme: alt
      text: Coming from React?
      link: /from-react
    - theme: alt
      text: GitHub
      link: https://github.com/denislibs/continuum

features:
  - title: Values across time, not snapshots
    details: A Behavior is a value that exists at every moment; an Event is a stream of discrete occurrences. State is modeled, not synchronized.
  - title: Glitch-free by construction
    details: Updates run in transactions — one moment of logical time with rank-ordered propagation. Diamonds never observe half-updated state.
  - title: No re-renders
    details: A component function runs exactly once. The DOM is wired to Behaviors directly; only the text node or attribute that depends on a value updates.
  - title: Small enough to read
    details: "The whole stack — core, DOM renderer, utilities, router — fits in under 8 kB brotli. Hard size budgets are enforced in CI."
---

## Try it

```bash
npm create continuum-js@latest my-app
```

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

No hooks, no dependency arrays, no memoization. The click flows into the FRP
network, `accum` folds it into a Behavior, and exactly one text node is
patched — the component function never runs again.
