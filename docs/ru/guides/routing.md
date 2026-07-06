# Роутинг

`@continuum-js/router` обращается с URL так, как положено в этой модели: это
**Behavior**. Смена роута — смена динамического региона; уход со страницы
уничтожает её поддерево через дерево владения.

## Роуты

```tsx
import {
  Router,
  Outlet,
  Link,
  lazy,
  type RouteDef,
} from "@continuum-js/router";

const routes: RouteDef[] = [
  {
    path: "",
    component: Layout, // рендерит <Outlet /> для детей
    children: [
      { path: "", component: Home },
      { path: "users/:id", component: UserPage },
      {
        path: "admin",
        guard: (params) => isAdmin() || "/login",
        component: AdminPage,
      },
      { path: "*", component: NotFound },
    ],
  },
];

<Router routes={routes} fallback={() => <NotFound />} />;
```

- `:id` становится `params.id`; `*` ловит остаток как `params["*"]`;
- роут без `component` — pathless layout: дети рендерятся насквозь;
- `fallback` рендерится, когда не совпало ничего.

## Вложенность: `<Outlet>`

Layout рендерит совпавшего ребёнка через `<Outlet />`:

```tsx
function Layout() {
  return (
    <div>
      <nav>
        <Link href="/">Главная</Link>
        <Link href="/users/1">Пользователь 1</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

`<Link>` перехватывает простые левые клики в клиентскую навигацию и несёт
класс `active` (точное совпадение для `/`, префикс для остальных; `end`
форсирует точное; `activeClass` меняет имя).

## Параметры — это Behavior

```tsx
import { useParams } from "@continuum-js/router";

function UserPage() {
  const params = useParams(); // Behavior<Params>, свои + предков
  const user = resource(
    params.map((p) => p.id).updates,
    (id) => api.fetchUser(id),
  );
  return …;
}
```

Регион ключуется **идентичностью роута**, а не URL: навигация
`/users/1 → /users/2` не пересобирает `UserPage` — обновляется только
behavior `params`. Тонкозернистое обещание, применённое к роутингу.

## Guards

Guard — чистая функция от параметров: верните `true`, чтобы пропустить, или
путь для редиректа. Редиректы применяются как _replace_-навигация, чтобы
защищённый URL не засорял историю.

## Разделение кода

`lazy` принимает thunk с **литеральным** `import()` — именно литерал
заставляет бандлер выделить отдельный чанк:

```tsx
const About = lazy(() => import("./pages/About.js"), {
  fallback: () => <p>загрузка…</p>,
  error: (e) => <p>не загрузилось</p>,
});
```

Загрузчик выполняется при первом визите и кэшируется навсегда. Pending и
error — обычные значения, которые рендерит регион; никакого Suspense.

## Программная навигация

```ts
import { location, navigate } from "@continuum-js/router";

navigate("/users/2"); // pushState
navigate("/login", { replace: true }); // replaceState
const url = location(); // Behavior<URL> — синглтон
```

`location()` следует и за кнопками назад/вперёд (popstate). Производные от
него — обычный FRP: `location().map((u) => u.searchParams.get("q"))`.

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
