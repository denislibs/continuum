# Из React в Continuum

Один и тот же код бок о бок: слева — идиоматичный React (19, функциональные
компоненты + хуки), справа — Continuum. Цель — не «React плохой», а показать,
куда девается каждая привычная конструкция и почему многих из них здесь просто
нет.

Главный сдвиг ментальной модели — один:

> **React**: компонент — функция рендера. Она перезапускается на каждое
> изменение, а хуки протаскивают состояние между перезапусками.
>
> **Continuum**: компонент выполняется **один раз**. Реактивные величины —
> это объекты (`Behavior`), которые кладутся прямо в JSX; дальше меняются
> только затронутые текстовые узлы и атрибуты.

Отсюда следствия: нет re-render'ов → нет deps-массивов, нет `memo`, нет
`useCallback`, нет stale closures, нет правил хуков.

## Таблица соответствий

| React                         | Continuum                              | Комментарий                                                        |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `useState(init)`              | `newBehavior(init)`                    | возвращает `[Behavior, set]`; можно объявлять и вне компонента     |
| `useMemo(f, [a, b])`          | `a.map(f)` / `Behavior.lift2(f, a, b)` | зависимости — сама структура выражения, массив не нужен            |
| `useEffect(f, [x])`           | `x.listen(f)` + `onCleanup`            | подписка на значение; очистка — явная и одноразовая                |
| `useEffect(f, [])` (маунт)    | `onMount(f)`                           | вызывается один раз, когда узлы уже вставлены в DOM                |
| `useEffect(fetch…)`           | `perform` / `resource`                 | IO — граница сети; ошибки — данные (`Result`), не исключения       |
| `useContext` / `<Provider>`   | `use(ctx)` / `provide(ctx, v)`         | то же, но через дерево владения                                    |
| `useRef(dom)`                 | обычная переменная или `ref={…}`       | компонент выполняется один раз — `const el = <div/>` уже стабилен  |
| `useCallback` / `memo`        | —                                      | не нужны: ничего не перезапускается, идентичность стабильна        |
| `key` в списках               | `by` в `<Each>`                        | тот же смысл (keyed reconciliation, у нас LIS-диффинг)             |
| `{cond && <A/>}`              | `<Show when={b}>`                      | перестройка только при смене истинности                            |
| `<Suspense>` + `React.lazy`   | `lazy(() => import(…), { fallback })`  | pending/error — обычные значения, не механизм исключений           |
| Error Boundary (класс / либа) | `<Catch fallback={(e, reset) => …}>`   | компонент, не класс; ловит ошибки построения и пересборки регионов |
| `useSyncExternalStore`        | `Behavior.fromPoll` / `newBehavior`    | внешний мир входит как behavior                                    |
| `onClick={handler}`           | `onClick={fire}`                       | событие уходит в FRP-сеть, не в setState                           |
| StrictMode double-render      | —                                      | нечему перезапускаться — нечего и проверять                        |

---

## 1. Счётчик

**React**

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>;
}
```

**Continuum**

```tsx
import { newBehavior } from "@continuum-js/frp";

function Counter() {
  const [count, setCount] = newBehavior(0);
  return (
    <button onClick={() => setCount(count.sample() + 1)}>count: {count}</button>
  );
}
```

Почти одинаково — но семантика разная: React перезапустит `Counter` на
каждый клик и пере-render'ит поддерево; Continuum выполнит `Counter` один
раз, а клик патчит ровно один текстовый узел — тот, что привязан к `count`.
Любители потоков могут выразить тот же счётчик событием:
`clicks.accum(0, (_e, n) => n + 1)` — «count есть свёртка кликов».

## 2. Производное состояние

**React** — мемоизация с ручным перечислением зависимостей:

```tsx
function Cart({ items }: { items: Item[] }) {
  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items], // забыли элемент — получили баг со stale-значением
  );
  const label = useMemo(() => `${total.toFixed(2)} ₸`, [total]);
  return <b>{label}</b>;
}
```

**Continuum** — зависимость и есть выражение:

```tsx
function Cart(props: { items: Behavior<Item[]> }) {
  const total = props.items.map((xs) =>
    xs.reduce((s, i) => s + i.price * i.qty, 0),
  );
  const label = total.map((t) => `${t.toFixed(2)} ₸`);
  return <b>{label}</b>;
}
```

Массивов зависимостей нет как класса: `label` зависит от `total`, потому что
_построен из него_. Забыть зависимость синтаксически невозможно. Несколько
источников — `Behavior.lift2((a, b) => …, ba, bb)`.

## 3. Эффект и его очистка

**React**

```tsx
function Online() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []); // пустой массив — «только на маунте», это надо ЗНАТЬ
  return <span>{online ? "online" : "offline"}</span>;
}
```

**Continuum**

```tsx
import { newBehavior } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";

function Online() {
  const [online, setOnline] = newBehavior(navigator.onLine);
  const on = () => setOnline(true);
  const off = () => setOnline(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  onCleanup(() => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  });
  return <span>{online.map((o) => (o ? "online" : "offline"))}</span>;
}
```

Тело компонента — обычный код, который выполняется один раз, поэтому «эффект
на маунте» — это просто код в теле, а `onCleanup` регистрирует уборку в дереве
владения: размонтирование поддерева вызовет её каскадно.

Один нюанс: тело выполняется _до_ вставки узлов в документ. Если эффекту нужен
живой элемент — фокус, измерения, инициализация сторонней библиотеки — есть
`onMount`: колбэк выполнится сразу после вставки поддерева (при первом
монтировании, при переключении `dyn`/`Show`, при добавлении строки в `Each`).
Дочерние скоупы монтируются раньше родительских, как в React.

```tsx
import { onMount, onCleanup } from "@continuum-js/dom";

function SearchBox() {
  const input = (<input placeholder="поиск…" />) as HTMLInputElement;
  onMount(() => input.focus()); // элемент уже в документе
  return input;
}
```

Если элемент объявлен глубоко в JSX и в переменную его выносить неудобно,
работает знакомый `ref` — функцией (`ref={(el) => …}`) или объектом
(`ref={obj}` запишет элемент в `obj.current`). Он срабатывает при создании
элемента, поэтому для фокуса/измерений сочетайте его с `onMount`.

В отличие от хуков React, `onMount`/`onCleanup` — обычные функции: их можно
звать в условиях, в циклах и выносить в хелперы без правил хуков.

## 4. Загрузка данных

**React** — руками (упрощённо; в реальности — TanStack Query именно потому,
что руками это больно):

```tsx
function User({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // защита от гонки ответов — вручную
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p>loading…</p>;
  if (error) return <p>error</p>;
  return <p>{user!.name}</p>;
}
```

**Continuum** — `resource` из std: конечный автомат `idle → loading → ok |
error`, гонка ответов решена внутри (last-request-wins):

```tsx
import { type Behavior } from "@continuum-js/frp";
import { Dynamic } from "@continuum-js/dom";
import { resource } from "@continuum-js/std";

function User(props: { id: Behavior<string> }) {
  const state = resource(props.id.updates, (id) =>
    fetch(`/api/users/${id}`).then((r) => r.json() as Promise<User>),
  );
  return (
    <Dynamic value={state}>
      {(s) =>
        s.status === "loading" ? (
          <p>loading…</p>
        ) : s.status === "error" ? (
          <p>error</p>
        ) : s.status === "ok" ? (
          <p>{s.value.name}</p>
        ) : (
          <p>—</p>
        )
      }
    </Dynamic>
  );
}
```

Три `useState`-флажка («грязное состояние» из FRP-MODEL.md §1) схлопнулись в
одно значение-автомат. Ошибка — не исключение, а ветка данных.

## 5. Список с ключами

**React**

```tsx
<ul>
  {todos.map((t) => (
    <li key={t.id}>{t.text}</li>
  ))}
</ul>
```

**Continuum**

```tsx
<ul>
  <Each each={todos} by={(t) => t.id}>
    {(t) => <li>{t.text}</li>}
  </Each>
</ul>
```

`by` — тот же `key`. Разница под капотом: React ре-рендерит родителя и
диффит VDOM; `<Each>` держит по живому поддереву на ключ и переставляет DOM
минимальными ходами (LIS), сохраняя фокус.

## 6. Условный рендер

**React**

```tsx
{
  user ? <Profile user={user} /> : <Guest />;
}
```

**Continuum**

```tsx
<Show when={user} fallback={() => <Guest />}>
  {(u) => <Profile user={u} />}
</Show>
```

`<Show>` перестраивает поддерево только когда меняется _истинность_ `when`,
а не на каждое обновление значения. (Есть и функциональная форма `when(b,
then, else)` — для кода без JSX.)

## 7. Контролируемый инпут

**React**

```tsx
const [text, setText] = useState("");
<input value={text} onChange={(e) => setText(e.target.value)} />;
```

**Continuum**

```tsx
const [text, setText] = newBehavior("");
<input {...bindInput(text, setText)} />;
```

Так же, минус перезапуски компонента на каждый символ.

## 8. Контекст

**React**

```tsx
const Theme = createContext("light");

function App() {
  return (
    <Theme.Provider value="dark">
      <Toolbar />
    </Theme.Provider>
  );
}
function Toolbar() {
  const theme = useContext(Theme);
  return <div className={theme}>…</div>;
}
```

**Continuum**

```tsx
const Theme = createContext("light");

function App() {
  provide(Theme, "dark"); // пишет в текущего владельца
  return <Toolbar />;
}
function Toolbar() {
  const theme = use(Theme); // ищет вверх по дереву владения
  return <div class={theme}>…</div>;
}
```

Провайдер — не обёртка-компонент, а запись в дерево владения. Хочешь
реактивную тему — положи в контекст `Behavior<string>` и используй его в
атрибуте как обычно.

## 9. Debounce-поиск

**React** — кастомный хук (и его поддержка):

```tsx
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
const debouncedQuery = useDebounced(query, 300);
```

**Continuum** — комбинатор над событием:

```tsx
import { debounce } from "@continuum-js/std";

const settled = debounce(query.updates, 300); // Event<string>
const results = resource(settled, search);
```

## 10. Ленивая страница + роутер

**React** (react-router + Suspense)

```tsx
const About = React.lazy(() => import("./About"));

<Routes>
  <Route path="/" element={<Home />} />
  <Route
    path="/about"
    element={
      <Suspense fallback={<p>loading…</p>}>
        <About />
      </Suspense>
    }
  />
</Routes>;
```

**Continuum**

```tsx
import { Router, lazy, type RouteDef } from "@continuum-js/router";

const About = lazy(() => import("./About.js"), {
  fallback: () => <p>loading…</p>,
});

const routes: RouteDef[] = [
  { path: "", component: Home },
  { path: "about", component: About },
];

<Router routes={routes} />;
```

Чанк-сплиттинг одинаковый (литеральный `import()` режет бандлер), но
pending-состояние — не «подвешенный рендер, пойманный Suspense'ом», а обычное
значение. Бонус Continuum-роутера: `/users/1 → /users/2` не пересобирает
страницу — обновляется только `useParams()`-behavior.

---

## Чего в Continuum нет — и почему

- **Re-render'ов.** Компонент — конструктор поддерева, а не функция рендера.
  Обновление — это протяжка значения по графу до конкретного текстового узла.
- **Deps-массивов.** Зависимости выражения — само выражение (`map`/`lift`).
  Класс багов «забыл зависимость» / «лишняя зависимость» не существует.
- **`memo` / `useCallback` / стабилизации идентичности.** Ничего не
  перезапускается, идентичность значений и функций стабильна по построению.
- **Stale closures.** Замыкание захватывает `Behavior` — саму величину, а не
  её снапшот; `b.sample()` всегда читает актуальное.
- **Правил хуков.** `newBehavior`/`listen` — обычные функции: можно в
  условии, в цикле, вне компонента, в модуле.
- **Suspense как механизма.** Асинхронность — это данные (`Async<T>`,
  `Result<E, T>`), их рендерят обычным `<Show>`/`<Dynamic>`.
- **Батчинга как оптимизации.** Транзакции ядра — это не «оптимизация
  склейкой», а модель одновременности: одномоментные изменения атомарны по
  построению (см. [FRP-MODEL.md](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md)).

## Что честно сказать про обратную сторону

- **Непривычная модель.** Думать величинами-во-времени и потоками
  происшествий — навык; порог входа выше, чем «просто пиши функции».
  Читать сначала: [PHILOSOPHY.md](https://github.com/denislibs/continuum/blob/main/PHILOSOPHY.md), затем
  [FRP-MODEL.md](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).
- **Задержка `hold`.** Внутри одного момента чтения видят значение _до_
  него — это фича (иначе рекурсивное состояние не определить), но первые
  пару раз удивляет.
- **Экосистема.** У React — вселенная библиотек; у нас — frp/dom/std/router/
  test и дорожная карта.

Живой код всех примеров — в [`examples/`](https://github.com/denislibs/continuum/tree/main/examples): счётчик, todo, поиск с
debounce, анимация, роутер.

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
