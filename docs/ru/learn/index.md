---
title: Интерактивный тренажёр
aside: false
outline: false
sidebar: false
---

# Учитесь на практике

Короткие упражнения с проверкой. Пишете код, жмёте **Check**, переходите
дальше, когда загорается зелёный. Откройте вкладку **Compiled** — увидите, во
что превращается ваш JSX: никаких ре-рендеров, только точечные обновления DOM.

<div class="cn-tracks">
  <a class="cn-track-card" href="./basics">
    <h3>Основы →</h3>
    <p>Состояние, производные значения и рендеринг — базовый цикл.</p>
  </a>
  <a class="cn-track-card" href="./streams">
    <h3>Потоки →</h3>
    <p>События как значения: свёртка, hold, слияние, сэмплирование.</p>
  </a>
  <a class="cn-track-card" href="./dom">
    <h3>DOM и компоненты →</h3>
    <p>Компоненты, привязки атрибутов, Show, Each, Dynamic, контекст.</p>
  </a>
  <a class="cn-track-card" href="./patterns">
    <h3>Паттерны →</h3>
    <p>Реальные фичи в несколько строк: фильтр, суммы, undo, форма todo.</p>
  </a>
  <a class="cn-track-card" href="./async">
    <h3>Асинхронность →</h3>
    <p>Сеть как значения: perform, resource и гонки, решённые сами собой.</p>
  </a>
  <a class="cn-track-card" href="./router">
    <h3>Роутер →</h3>
    <p>URL как значение: маршруты, ссылки, параметры, вложенные макеты.</p>
  </a>
  <a class="cn-track-card" href="./forms">
    <h3>Формы →</h3>
    <p>Поля ввода без рутины: связать, проверить, вывести, закрыть submit.</p>
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
  transition:
    border-color 0.2s,
    transform 0.2s;
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
