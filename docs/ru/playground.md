---
title: Песочница
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
      кликнули {count} раз
    </button>
  );
}`;
</script>

<ClientOnly>
  <Playground full lang="ru" :code="counterCode" />
</ClientOnly>
