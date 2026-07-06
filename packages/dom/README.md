# @continuum-js/dom

Тонкий fine-grained рендерер поверх [`@continuum-js/frp`](../frp). Отображает
`Behavior`/`Event` в реальные DOM-узлы с точечными обновлениями; работает с
обычным JSX через **автоматический рантайм** (`import { h }` не нужен).

```tsx
import { newBehavior } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

const [name, setName] = newBehavior("world");
mount(document.body, () => <h1>hello {name}</h1>);
setName("continuum"); // патчится один текст-узел
```

- **`h` / `Fragment`** — JSX-фабрика; компонент вызывается один раз. `Behavior`
  в детях → живой текст-узел; `Behavior` в пропсах → живой атрибут/свойство;
  `on*` → DOM-слушатель.
- **`dyn(b, render)`** — условное/переключаемое поддерево.
- **`each(items, key, render)`** — keyed-список с LIS-диффингом и сохранением
  фокуса.
- **Дерево владения** — `root` / `scope` / `onCleanup`: каскадная очистка
  подписок при сносе динамических регионов.
- **Контекст** — `createContext` / `provide` / `use` поверх дерева владения.
- **Хелперы** — `when`, `bindInput`, `portal`, `mount`, `animationFrames`.
- **SVG** — теги `<svg>`, `<rect>`, `<path>`, `<circle>`, … создаются в SVG-неймспейсе
  (`createElementNS`); `class` и атрибуты (`viewBox`, `fill`, …) ставятся корректно.
  HTML внутри `<foreignObject>` остаётся HTML.
- **Компоненты-обёртки** — JSX над хелперами (в духе Solid):

```tsx
<Show when={user} fallback={() => <Guest />}>
  {(u) => <span>{u.name}</span>}
</Show>

<Each each={items} key={(i) => i.id}>
  {(item) => <li>{item.name}</li>}
</Each>

<Dynamic value={route}>{(r) => (r === "home" ? <Home /> : <About />)}</Dynamic>

<Portal mount={document.body}><Modal /></Portal>
```

### Настройка JSX (автоматический рантайм)

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@continuum-js/dom",
  },
}
```

Для Vite/esbuild — `jsx: "automatic"`, `jsxImportSource: "@continuum-js/dom"`.
Классическая фабрика тоже поддерживается (`h`/`Fragment` экспортируются) — тогда
`--jsx react --jsxFactory h --jsxFragmentFactory Fragment` и `import { h }` в
каждом файле с JSX.
