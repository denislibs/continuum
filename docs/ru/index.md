---
layout: home

hero:
  name: Continuum
  text: Классический FRP для DOM
  tagline: Behaviors, Events и тонкозернистый рендеринг. Компонент выполняется один раз — ре-рендеров, с которыми нужно бороться, просто нет.
  actions:
    - theme: brand
      text: Туториал
      link: /ru/tutorial/thinking-in-frp
    - theme: alt
      text: Пришли из React?
      link: /ru/from-react
    - theme: alt
      text: GitHub
      link: https://github.com/denislibs/continuum

features:
  - title: Значения во времени, а не снимки
    details: Behavior — значение, существующее в каждый момент; Event — поток дискретных вхождений. Состояние моделируется, а не синхронизируется.
  - title: Отсутствие глитчей по построению
    details: Обновления идут в транзакциях — один момент логического времени с распространением по рангам. Ромб зависимостей никогда не увидит полуобновлённое состояние.
  - title: Нет ре-рендеров
    details: Функция компонента выполняется ровно один раз. DOM подключён к Behaviors напрямую — обновляется только тот текстовый узел или атрибут, который зависит от значения.
  - title: Достаточно маленький, чтобы прочитать
    details: "Весь стек — ядро, DOM-рендерер, утилиты, роутер — меньше 8 kB brotli. Жёсткие бюджеты размера проверяются в CI."
---

## Попробовать

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

Ни хуков, ни массивов зависимостей, ни мемоизации. Клик втекает в FRP-сеть,
`accum` сворачивает его в Behavior, и патчится ровно один текстовый узел —
функция компонента больше никогда не выполняется.
