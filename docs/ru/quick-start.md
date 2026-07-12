# Быстрый старт

## Создать проект

```bash
npm create continuum-js@latest my-app
cd my-app
npm install
npm run dev
```

Получается проект Vite + TypeScript:

```
my-app/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json          # jsx: react-jsx, jsxImportSource: @continuum-js/dom
└─ src/
   ├─ main.tsx            # mount(document.getElementById("app")!, () => <App />)
   ├─ App.tsx             # счётчик на выброс
   └─ App.test.tsx        # vitest-тест для честности
```

`npm run build` проверяет типы и собирает; `npm test` гоняет vitest.

## Добавить в существующий Vite-проект

```bash
npm i @continuum-js/frp @continuum-js/dom @continuum-js/std
```

Направьте JSX на рантайм Continuum в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@continuum-js/dom"
  }
}
```

Смонтируйте вью:

```tsx
import { mount } from "@continuum-js/dom";

mount(document.getElementById("app")!, () => <App />);
```

`mount` возвращает функцию размонтирования, уничтожающую всё поддерево —
подписки, таймеры, DOM.

## Первая правка

Откройте `src/App.tsx` и заставьте счётчик считать вдвое:

```tsx
const count = state(0);
const doubled = count.map((n) => n * 2); // [!code ++]
```

Положите `{doubled}` в любое место JSX. Обратите внимание, чего вы **не**
делали: ни массива зависимостей, ни memo, ни ре-рендера — `doubled` выведен
из `count` по построению.

## Дальше

- [Мышление в States и Streams](/ru/tutorial/thinking-in-frp) — модель,
  стоящая за только что написанным.
- [Понятия → Компоненты](/ru/concepts/components) — что здесь такое
  компонент.
