<script setup lang="ts">
// Side-by-side "same component, two frameworks" tabs for the landing. Static
// code samples; the point is the shape, not execution (the live version is the
// playground). React on the left to show what the reader already knows.
import { ref } from "vue";

const props = withDefaults(defineProps<{ lang?: "en" | "ru" }>(), {
  lang: "en",
});
const ru = props.lang === "ru";
const tab = ref<"react" | "continuum">("react");

const react = `import { useState } from "react";

function Counter() {
  // the component re-runs on every render
  const [count, setCount] = useState(0);
  const double = count * 2; // recomputed each render

  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count} / {double}
    </button>
  );
}`;

const continuum = `import { state } from "@continuum-js/frp";

function Counter() {
  // the component runs once, ever
  const count = state(0);
  const double = count.map((n) => n * 2); // a formula, wired once

  return (
    <button onClick={() => count.update((n) => n + 1)}>
      {count} / {double}
    </button>
  );
}`;
</script>

<template>
  <div class="cn-cmp">
    <div class="cn-cmp__tabs">
      <button :class="{ on: tab === 'react' }" @click="tab = 'react'">
        React
      </button>
      <button :class="{ on: tab === 'continuum' }" @click="tab = 'continuum'">
        Continuum
      </button>
    </div>
    <pre
      class="cn-cmp__code"
    ><code>{{ tab === "react" ? react : continuum }}</code></pre>
    <p class="cn-cmp__note" v-if="tab === 'react'">
      <template v-if="ru"
        >React заново выполняет весь компонент на каждое изменение и сравнивает
        старую разметку с новой.</template
      >
      <template v-else
        >Re-runs top to bottom on every change; <code>double</code> is
        recomputed, the tree is diffed.</template
      >
    </p>
    <p class="cn-cmp__note" v-else>
      <template v-if="ru"
        >Выполняется <strong>один раз</strong>. <code>double</code> сам
        пересчитывается из <code>count</code>, а по клику меняются ровно два
        числа на экране — без перерисовки.</template
      >
      <template v-else
        >Runs <strong>once</strong>. <code>double</code> is a formula wired to
        <code>count</code>; clicking patches exactly two text nodes — no
        re-render, no diff.</template
      >
    </p>
  </div>
</template>

<style scoped>
.cn-cmp {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  margin: 24px 0;
  background: var(--vp-c-bg-alt);
}
.cn-cmp__tabs {
  display: flex;
  gap: 4px;
  padding: 8px 10px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.cn-cmp__tabs button {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cn-cmp__tabs button.on {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
}
.cn-cmp__code {
  margin: 0;
  padding: 16px 18px;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  background: var(--vp-c-bg);
}
.cn-cmp__note {
  margin: 0;
  padding: 12px 18px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
}
</style>
