# Контекст

Контекст передаёт значения вниз по дереву, не протаскивая их через каждый
пропс. В Continuum он живёт на **дереве владения**: `provide` пишет в
текущего владельца, `use` ищет вверх по предкам.

```tsx
import { createContext, provide, use } from "@continuum-js/dom";

const Theme = createContext("light"); // значение по умолчанию

function App() {
  provide(Theme, "dark"); // запись в текущего владельца
  return <Toolbar />;
}

function Toolbar() {
  const theme = use(Theme); // ближайшее предоставленное значение
  return <div class={theme}>…</div>;
}
```

Обёртки `<Provider>` нет — предоставление это оператор, а не структура.
`provide` внутри поддерева `dyn`/`Show`/`Each` ограничен этим поддеревом и
исчезает вместе с ним.

## Реактивный контекст

Само значение контекста — обычное (ищется один раз, при построении). Для
меняющегося значения кладите в контекст **Behavior**:

```tsx
const Theme = createContext<Behavior<string>>(constant("light"));

function App() {
  const [theme, setTheme] = newBehavior("dark");
  provide(Theme, theme);
  return <Toolbar />;
}

function Toolbar() {
  return <div class={use(Theme)}>…</div>; // живая привязка
}
```

«Ре-рендера по смене контекста» не существует и не нужно: потребители
привязываются к Behavior один раз.

## Практическое правило

`use` читает контекст места, где он _вызван_ — зовите его в теле компонента
(при построении), а не в обработчиках событий или асинхронных колбэках.

Роутер построен ровно на этом механизме: `<Outlet>` и `useParams()` читают
`RouterContext` с цепочкой совпадений и текущей глубиной — см.
[Роутинг](/ru/guides/routing).
