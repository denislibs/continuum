---
title: Playground
layout: page
aside: false
outline: false
sidebar: false
---

<script setup>
const counterCode = `import { state } from '@continuum-js/frp';

export default function Counter() {
  const count = state(0);
  return (
    <button onClick={() => count.update((n) => n + 1)}>
      clicked {count} times
    </button>
  );
}`;
</script>

<ClientOnly>
  <Playground full :code="counterCode" />
</ClientOnly>
