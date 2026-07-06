# @continuum/dom

Тонкий fine-grained рендерер поверх [`@continuum/frp`](../frp). Отображает
`Behavior`/`Event` в реальные DOM-узлы с точечными обновлениями; работает с
обычным JSX без фреймворк-специфичного трансформа (`--jsxFactory h`).

```tsx
import { newBehavior } from "@continuum/frp";
import { h, mount } from "@continuum/dom";

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
- **Хелперы** — `when`, `bindInput`, `portal`, `mount`.

### Сборка (tsc, как в спецификации §15)

```bash
tsc frp.ts dom.tsx app.tsx \
  --target es2020 --module esnext --strict \
  --jsx react --jsxFactory h --jsxFragmentFactory Fragment \
  --lib es2020,dom
```
