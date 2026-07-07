# Паттерны

::: tip На пальцах
Кулинарная книга. Двадцать два рецепта — от «нужно каждому приложению» до
«нишевых, но восхитительных». Каждый — маленькая законченная идея, которую
можно унести к себе в код. Пробегитесь по заголовкам и берите нужное.
:::

Рецепты предполагают знание основ: [состояние](/ru/guides/state),
[асинхронность](/ru/guides/async), [события и
поведения](/ru/concepts/events). Импорты показаны один раз на сниппет; всё
берётся из `@continuum-js/frp`, `@continuum-js/dom` или `@continuum-js/std`.

## Состояние

### 1. Actions — Redux без Redux

**Когда:** одно состояние, много видов изменений (добавить / удалить /
переключить…).

Соберите все изменения в один `Event<Action>` и сверните его одним чистым
редьюсером. `accum` — это и есть стор; библиотека не нужна.

```tsx
type Action =
  | { type: "add"; text: string }
  | { type: "remove"; id: string }
  | { type: "toggle"; id: string };

const [actions, dispatch] = newEvent<Action>();

const todos = actions.accum<Todo[]>([], (a, acc) => {
  switch (a.type) {
    case "add":
      return [...acc, createTodo(a.text)];
    case "remove":
      return acc.filter((t) => t.id !== a.id);
    case "toggle":
      return acc.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t));
  }
});

<button onClick={() => dispatch({ type: "remove", id: t.id })}>×</button>;
```

Вся логика списка читается сверху вниз в одном месте, а каждое изменение —
значение, которое можно логировать, воспроизводить и тестировать.

### 2. Undo / redo

**Когда:** у вас уже паттерн actions и хочется историю бесплатно.

Сверните _тот же самый_ поток действий в историю вместо простого значения:

```ts
type Hist = { past: Todo[][]; present: Todo[] };

const history = actions.accum<Hist>({ past: [], present: [] }, (a, h) => {
  if (a.type === "undo") {
    const prev = h.past.at(-1);
    return prev ? { past: h.past.slice(0, -1), present: prev } : h;
  }
  return { past: [...h.past, h.present], present: reduce(a, h.present) };
});
const todos = history.map((h) => h.present);
const canUndo = history.map((h) => h.past.length > 0);
```

Один поток действий — несколько свёрток над ним: это та точка, где FRP
начинает окупаться.

### 3. Не храни то, что можно вывести

**Когда:** рука тянется сделать два `set` из одного обработчика.

Два хранимых значения, обязанных совпадать, однажды разойдутся. Храните
_исходный_ факт, остальное вычисляйте:

```ts
// ❌ два источника истины, синхронизируемых вручную
const [items, setItems] = newBehavior<Item[]>([]);
const [total, setTotal] = newBehavior(0); // забыли обновить один раз — баг

// ✅ один источник, остальное — арифметика
const [items, setItems] = newBehavior<Item[]>([]);
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const isEmpty = items.map((xs) => xs.length === 0);
```

Производные бесплатны: ни массивов зависимостей, ни ключей мемоизации, ни
устаревания.

### 4. Общий стор в модуле

**Когда:** одно состояние нужно нескольким компонентам по всему приложению.

Источники закреплены автоматически, а вот модульная _производная_ обязана
явно отказаться от авто-уничтожения через `.retain()` (см. [частые
ошибки](/ru/guides/common-mistakes), №7):

```ts
// store.ts
export const [cart, setCart] = newBehavior<Item[]>([]);
export const cartTotal = cart
  .map((xs) => xs.reduce((s, i) => s + i.price, 0))
  .retain(); // разделяемая производная живёт дольше любого компонента
```

## События как алгебра

### 5. Прочитать состояние в момент события — `snapshot`

**Когда:** обработчику нужно «значение на момент этого клика».

```ts
// отправить текущий черновик
const submitted = submits.snapshot(draft, (_e, text) => text);
```

`sampleWith(trigger, b)` из std — то же самое, когда полезная нагрузка
триггера не нужна. Помните про [задержку hold](/ru/concepts/transactions):
внутри момента читается значение _до_ момента — именно это делает приём
композируемым.

### 6. Поставить поток на паузу — `gate`

**Когда:** игнорировать ввод, пока что-то в полёте.

```ts
const [saving, setSaving] = newBehavior(false);
const effectiveClicks = saveClicks.gate(saving.map((s) => !s));
```

Пока «ворота» закрыты, у потока просто нет происшествий — коду ниже не нужны
рассыпанные `if (saving) return`.

### 7. Только изменения — `distinct` / `distinctB`

**Когда:** шумный источник повторяет одно и то же значение.

```ts
import { distinct } from "@continuum-js/frp";
import { distinctB } from "@continuum-js/std";

const realMoves = distinct(moves); // Event: отбросить подряд идущие равные
const stableTheme = distinctB(theme); // Behavior: подавить пустые обновления
```

`distinctB` — способ не дать области `dyn`/`<Dynamic>` пересобираться на
записи того же значения.

### 8. Прошлое + текущее — `pairwise` и `previous`

**Когда:** важно направление изменения (скролл вверх/вниз, стрелки тренда).

```ts
import { pairwise, previous } from "@continuum-js/std";

const direction = pairwise(scrollY).map(([prev, cur]) =>
  cur > prev ? "down" : "up",
);
const lastPrice = previous(price, 0); // Behavior, отстающий на шаг
const trend = Behavior.lift2(
  (now, before) => Math.sign(now - before),
  price,
  lastPrice,
);
```

### 9. Разделить поток — `partition`

**Когда:** один источник, две судьбы.

```ts
import { partition } from "@continuum-js/std";

const [oks, errs] = partition(responses, (r) => r.ok);
```

### 10. Парси, а не валидируй — `filterMap`

**Когда:** фильтрация и преобразование — на самом деле одна операция.

```ts
import { filterMap } from "@continuum-js/std";

// Event<string> → Event<number>, невалидный ввод не попадает в сеть вовсе
const amounts = filterMap(inputs, (s) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
});
```

Ниже этой строки плохих значений _не существует_ — это гарантирует тип.

### 11. Успокоить пожарный шланг — `debounce` / `throttle`

**Когда:** клавиши, скролл, ресайз.

```ts
import { debounce, throttle } from "@continuum-js/std";

const settledQuery = debounce(queryInput, 300); // когда юзер перестал печатать
const scrollSample = throttle(scrolls, 100); // не чаще 10 раз/сек
```

### 12. Состояние из многих источников — слияние событий-_функций_

**Когда:** actions кажется тяжеловесным, а источники по-настоящему
независимы.

Нишевый, но прекрасный трюк: превратите каждый источник в _функцию над
состоянием_, слейте, сверните применением:

```ts
const increments = plusClicks.mapTo((n: number) => n + 1);
const decrements = minusClicks.mapTo((n: number) => n - 1);
const resets = resetClicks.mapTo((_: number) => 0);

const counter = increments
  .orElse(decrements)
  .orElse(resets)
  .accum(0, (f, n) => f(n));
```

Ни типов действий, ни switch — каждый источник несёт свою семантику с собой.
Если два источника могут выстрелить в один момент и оба должны примениться,
вместо `orElse` возьмите `Event.merge(l, r, (f, g) => (n) => g(f(n)))`.

## Асинхронность

### 13. IO на границе — `perform` + `Result`

**Когда:** любой эффект. Это _тот самый_ граничный паттерн, на котором стоит
вся асинхронность.

```ts
import { perform } from "@continuum-js/frp";

const responses = perform(saveRequests, (todo) => api.save(todo));
// Event<Result<unknown, Saved>> — ошибки приходят данными, а не бросками

const [saved, failed] = partition(responses, (r) => r.ok);
```

### 14. Поиск без гонок — `resource`

**Когда:** ответы могут приходить не по порядку (живой поиск, фильтры).

```ts
import { resource } from "@continuum-js/std";

const results = resource(debounce(queries, 300), (q) =>
  fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
);
// Behavior<Async<T>>: idle → loading → ok | error, «последний запрос
// побеждает» уже встроено

<Dynamic value={results}>
  {(r) =>
    r.status === "loading" ? <Spinner />
    : r.status === "error" ? <Oops error={r.error} />
    : r.status === "ok" ? <List items={r.value} />
    : <Hint />}
</Dynamic>
```

Классический баг «ответы пришли не по порядку» решён _внутри_ `resource`
нумерацией запросов — обратно его не внести.

### 15. Оптимистичные обновления

**Когда:** UI должен отреагировать мгновенно, а с сервером — свериться позже.

Действие применяется локально сразу; если сервер отказал, компенсирующее
действие возвращается через тот же редьюсер:

```ts
type Action = UserAction | { type: "rollback"; id: string };

const [userActions, dispatch] = newEvent<UserAction>();

const saves = perform(
  userActions.filter((a) => a.type === "add"),
  (a) => api.save(a),
);
const rollbacks: Event<Action> = filterMap(saves, (r) =>
  r.ok ? null : { type: "rollback", id: r.error.id },
);

const todos = (userActions as Event<Action>)
  .orElse(rollbacks)
  .accum<Todo[]>([], reduce);
```

Цикла здесь нет: `perform` возвращается в сеть _новым_ моментом.

### 16. Поллинг с выключателем

**Когда:** дашборды, счётчики уведомлений.

```ts
import { interval } from "@continuum-js/std";

const [live, setLive] = newBehavior(true);
const ticks = interval(30_000).gate(live);
const stats = resource(ticks, () => fetch("/api/stats").then((r) => r.json()));
```

Переключите `setLive(false)`, когда вкладка скрыта (`onMount` + слушатель
`visibilitychange`), — и поллинг вместе со всеми запросами ниже по течению
остановится как одно целое.

## UI

### 17. Мастер–детали — `lift2`

**Когда:** выбранный id плюс список — и представления выбранного элемента.

```ts
const [selectedId, select] = newBehavior<string | null>(null);

const selected = Behavior.lift2(
  (id, xs) => xs.find((t) => t.id === id) ?? null,
  selectedId,
  todos,
);

<Show when={selected.map((s) => s !== null)} fallback={() => <PickSomething />}>
  {() => <Detail item={selected} />}
</Show>
```

`selected` не может разойтись со списком: удалите выбранный элемент — и
панель деталей закроется по построению.

### 18. Источник как значение — `switchB`

**Когда:** _какой источник данных использовать_ — само по себе состояние.
Флагманский нишевый трюк классического FRP.

```ts
const source: Behavior<Behavior<Todo[]>> = mode.map((m) =>
  m === "local" ? localTodos : serverTodos,
);
const todos = Behavior.switchB(source);
// код ниже не знает и не хочет знать, что источник подменяемый
```

Всё построенное над `todos` — счётчики, фильтры, `<Each>` — переживает
подмену нетронутым. Та же форма с `Behavior.switchE` переключает потоки
событий (например, «какой WebSocket я сейчас слушаю»).

### 19. Модалка — `<Show>` + `<Portal>`

```tsx
const [open, setOpen] = newBehavior(false);

<Show when={open}>
  {() => (
    <Portal mount={document.body}>
      <div class="backdrop" onClick={() => setOpen(false)}>
        <dialog open>…</dialog>
      </div>
    </Portal>
  )}
</Show>;
```

Уборку делает владение: закрытие модалки уничтожает поддерево портала и все
подписки внутри него.

### 20. Императивный островок — `ref` + `onMount` + `onCleanup`

**Когда:** оборачиваете нереактивную библиотеку (график, карту, редактор).

```tsx
function Chart(props: { data: Behavior<number[]> }) {
  let el!: HTMLDivElement;
  onMount(() => {
    const chart = new ThirdPartyChart(el); // DOM уже в документе
    const un = props.data.listen((d) => chart.setData(d)); // реактивное → императивное
    onCleanup(() => {
      un();
      chart.destroy();
    });
  });
  return <div ref={(e) => (el = e)} />;
}
```

Паттерн всегда из трёх строк: создать в `onMount`, связать через `listen`,
разобрать в `onCleanup`. Ничего не течёт — дерево владения само вызовет вашу
уборку, когда компонент уйдёт.

### 21. Персист — `persist` + `loadPersisted`

**Когда:** состояние должно переживать перезагрузку страницы (туду,
черновики, настройки UI).

Персист — это _сток на границе_: прочитать один раз при создании, зеркалить
каждое изменение. Обе половинки есть в std — с защитой от битого JSON,
отсутствующего стораджа (SSR) и ошибок квоты:

```ts
import { persist, loadPersisted } from "@continuum-js/std";

const todos = actions.accum<Todo[]>(loadPersisted("todos", []), reduce);
onCleanup(persist("todos", todos));
```

Для «болтливого» состояния поставьте debounce перед зеркалом; а раз у вас
уже паттерн actions, синхронизация вкладок — просто ещё один диспетчер:
браузер кидает `storage` в _другие_ вкладки при каждой записи:

```ts
onMount(() => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === "todos" && e.newValue)
      dispatch({ type: "replace", todos: JSON.parse(e.newValue) });
  };
  window.addEventListener("storage", onStorage);
  onCleanup(() => window.removeEventListener("storage", onStorage));
});
```

Добавили туду в одной вкладке — обновились все, а редьюсер не изменился ни
на букву.

### 22. Шарируемая полиморфная кнопка — `ComponentProps`

**Когда:** один компонент дизайн-системы, который рендерится как `<button>`
или как ссылка — и принимает ровно те пропсы, что положены каждому варианту.

`ComponentProps<"button">` даёт полный типизированный набор атрибутов тега
(тот самый `React.ComponentProps`, к которому вы привыкли); размеченное
объединение по `as` выбирает, какой набор действует:

```tsx
import type { ComponentProps, Reactive } from "@continuum-js/dom";

type ButtonOwnProps = {
  variant?: "primary" | "secondary";
  loading?: Reactive<boolean>;
};

type ButtonProps =
  // `href?: never` закрывает дыру TS в юнионах: с необязательным
  // дискриминантом ссылочные пропсы иначе пролезали бы в кнопочную ветку.
  | (ComponentProps<"button"> &
      ButtonOwnProps & { as?: "button"; href?: never })
  | (ComponentProps<"a"> & ButtonOwnProps & { as: "a" });

export function Button(props: ButtonProps) {
  const { as, variant = "primary", loading, ...rest } = props;
  const cls = `btn btn-${variant}`;
  return as === "a" ? (
    <a class={cls} {...(rest as ComponentProps<"a">)} />
  ) : (
    <button
      class={cls}
      disabled={loading}
      {...(rest as ComponentProps<"button">)}
    />
  );
}
```

```tsx
<Button type="submit" loading={saving} onClick={(e) => save(e)}>Сохранить</Button>
<Button as="a" href="/docs" target="_blank">Документация</Button>
<Button href="/docs">…</Button> // ✗ ошибка компиляции: href требует as="a"
```

Что стоит унести с собой:

- **children проходят через спред** — рантайм доставляет их в
  `props.children`, так что `{...rest}` уносит их в тег;
- `loading` — это `Reactive<boolean>`: вызывающий передаёт хоть `true`, хоть
  живой `Behavior<boolean>`, и `disabled` следит за ним без проводки;
- обработчики результата полностью типизированы, включая `e.currentTarget`
  (`HTMLButtonElement` или `HTMLAnchorElement` по ветке).

---

Не нашли нужный рецепт? [Откройте
issue](https://github.com/denislibs/continuum/issues) — лучшие паттерны в
этом списке начинались с чьего-то «а как сделать…».
