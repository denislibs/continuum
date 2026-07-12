---
title: Playground
aside: false
outline: false
---

<script setup>
const counterCode = `import { state } from '@continuum-js/frp';

export default function Counter() {
  const count = state(0);
  return (
    <button onClick={() => count.set(count.sample() + 1)}>
      clicked {count} times
    </button>
  );
}`;
</script>

# Playground

Write Continuum, see it run. The framework here is the real published build —
the same bytes you get from npm. Edit the code and hit **Run**.

<ClientOnly>
  <Playground height="380px" :code="counterCode" />
</ClientOnly>

::: tip
Export a component as `default` and the playground mounts it. Use `console.log`
and the output shows up under the preview. **Share** puts your code in the URL.
:::
