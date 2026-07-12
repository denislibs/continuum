---
title: Interactive tutorial
aside: false
outline: false
sidebar: false
---

# Learn Continuum by doing

Short, checked exercises. Write code, hit **Check**, move on when it turns
green. Open the **Compiled** tab any time to see what your JSX becomes — no
re-renders, just pinpoint DOM updates.

<div class="cn-tracks">
  <a class="cn-track-card" href="./basics">
    <h3>Basics →</h3>
    <p>State, derived values, and rendering — the core loop.</p>
  </a>
  <a class="cn-track-card" href="./streams">
    <h3>Streams →</h3>
    <p>Events as first-class values: fold, hold, merge, sample.</p>
  </a>
  <a class="cn-track-card" href="./dom">
    <h3>DOM &amp; components →</h3>
    <p>Components, attribute bindings, Show, Each, Dynamic, context.</p>
  </a>
  <a class="cn-track-card" href="./patterns">
    <h3>Patterns →</h3>
    <p>Real features in a few lines: filter, totals, undo, a todo form.</p>
  </a>
  <a class="cn-track-card" href="./async">
    <h3>Async →</h3>
    <p>Talk to the network as values: perform, resource, races solved.</p>
  </a>
  <a class="cn-track-card" href="./router">
    <h3>Router →</h3>
    <p>The URL as a value: routes, links, params, nested layouts.</p>
  </a>
  <a class="cn-track-card" href="./forms">
    <h3>Forms →</h3>
    <p>Inputs without boilerplate: bind, validate, derive, gate submit.</p>
  </a>
</div>

<style>
.cn-tracks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.cn-track-card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none !important;
  transition: border-color 0.2s, transform 0.2s;
}
.cn-track-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.cn-track-card h3 {
  margin: 0 0 6px;
  color: var(--vp-c-brand-1);
}
.cn-track-card p {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>
