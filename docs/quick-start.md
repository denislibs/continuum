# Quick start

## Scaffold a project

```bash
npm create continuum-js@latest my-app
cd my-app
npm install
npm run dev
```

You get a Vite + TypeScript project:

```
my-app/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json          # jsx: react-jsx, jsxImportSource: @continuum-js/dom
└─ src/
   ├─ main.tsx            # mount(document.getElementById("app")!, () => <App />)
   ├─ App.tsx             # a counter to delete
   └─ App.test.tsx        # a vitest test to keep you honest
```

`npm run build` type-checks and bundles; `npm test` runs vitest.

## Add to an existing Vite project

```bash
npm i @continuum-js/frp @continuum-js/dom @continuum-js/std
```

Point JSX at the Continuum runtime in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@continuum-js/dom"
  }
}
```

Mount a view:

```tsx
import { mount } from "@continuum-js/dom";

mount(document.getElementById("app")!, () => <App />);
```

`mount` returns an unmount function that disposes the whole subtree —
subscriptions, timers, DOM.

## First edit

Open `src/App.tsx` and make the counter count double:

```tsx
const [count, setCount] = newBehavior(0);
const doubled = count.map((n) => n * 2); // [!code ++]
```

Put `{doubled}` anywhere in the JSX. Notice what you didn't do: no
dependency array, no memo, no re-render — `doubled` is derived from `count`
by construction.

## Next

- [Thinking in Behaviors and Events](/tutorial/thinking-in-frp) — the model
  behind what you just wrote.
- [Concepts → Components](/concepts/components) — what a component is here.
