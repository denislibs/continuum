---
layout: home

hero:
  name: Continuum
  text: Реактивный UI без ре-рендеров
  tagline: Компонент выполняется один раз. Состояние — реактивное значение, которое кладётся прямо в JSX; фреймворк сам держит DOM в синхроне, по одному текстовому узлу за раз.
  actions:
    - theme: brand
      text: Начать
      link: /ru/overview
    - theme: alt
      text: Пришли из React?
      link: /ru/from-react
    - theme: alt
      text: GitHub
      link: https://github.com/denislibs/continuum

features:
  - title: Состояние, которое просто обновляется
    details: Создал значение, положил в JSX, поменял из обработчика. Ни хуков, ни массивов зависимостей, ни мемоизации — производные значения это обычные вызовы функций.
  - title: Нет ре-рендеров
    details: Функция компонента выполняется ровно один раз. Обновляется только тот текстовый узел или атрибут, который зависит от значения — без виртуального DOM и диффинга.
  - title: Гарантированно без багов обновления
    details: Все обновления атомарны — производные значения не могут увидеть полуобновлённое состояние. Это гарантия семантики классического FRP, а не дисциплина.
  - title: Достаточно маленький, чтобы прочитать
    details: "Целое приложение — фреймворк, состояние и ваш код — собирается в 3,7 кБ gzip JavaScript; одни React + ReactDOM в ~12 раз больше. Жёсткие бюджеты размера проверяются в CI."
---

## Попробовать

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

Если вы знаете `useState`, вы уже знаете и это — с одной разницей:
`Counter` больше никогда не выполнится. `{count}` привязывает текстовый узел
к значению; клик патчит ровно этот узел.
