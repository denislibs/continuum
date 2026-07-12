---
title: Песочница
aside: false
outline: false
---

<script setup>
const counterCode = `import { state } from '@continuum-js/frp';

export default function Counter() {
  const count = state(0);
  return (
    <button onClick={() => count.set(count.sample() + 1)}>
      кликнули {count} раз
    </button>
  );
}`;
</script>

# Песочница

Пишите на Continuum — и сразу видите результат. Здесь работает настоящая
опубликованная сборка, те же байты, что вы получаете из npm. Меняйте код и
жмите **Run**.

<ClientOnly>
  <Playground height="380px" :code="counterCode" />
</ClientOnly>

::: tip
Экспортируйте компонент как `default` — песочница его смонтирует. `console.log`
выводится под превью. **Share** кладёт ваш код в URL.
:::
