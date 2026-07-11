# Свои композаблы

::: tip На пальцах
Композабл — обычная функция, которая создаёт живые вещи (состояние,
подписки, DOM-слушатели) и убирает за собой. Эта страница — конвенция имён
(`createX`, а не `useX`) и трёхстрочная анатомия, общая для всех композаблов.
:::

## Два сорта функций — два сорта имён

**Чистые хелперы** принимают значения и возвращают значения. Ни жизненного
цикла, ни scope — зовите откуда угодно, называйте как любую функцию:

```ts
const total = (items: Wire<Item[]>) =>
  items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
```

**Композаблы** создают живое и регистрируют уборку (внутри есть `onCleanup`,
`onMount`). Их надо звать во время построения компонента, поэтому имя несёт
предупреждающую этикетку — префикс **`create`**:

```ts
const size = createWindowSize(); // «create» = вызови раз, получи живую проводку
```

## Почему `createX`, а не `useX`

Префикс `use*` в React существует ради «правил хуков»: фиксированный порядок
вызовов, только верхний уровень, перезапуск на каждом рендере. **Ни одного из
этих правил у нас нет** — компонент выполняется один раз, композаблы можно
звать в `if`, в цикле, в любом порядке. Позаимствовать префикс `use*` — значит
позаимствовать вместе с ним чужую ментальную модель. `create` говорит ровно
то, что происходит: вызвали один раз — создалось что-то живое.

(Это совпадает с конвенцией Solid — по той же причине.)

## Анатомия: создать → связать → убрать

Каждый композабл — одни и те же три хода:

```ts
import { wire, type Wire } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";

export function createWindowSize(): Wire<{ w: number; h: number }> {
  // 1. создать живое значение
  const size = wire({ w: innerWidth, h: innerHeight });

  // 2. связать внешний мир с сетью (на границе!)
  const onResize = () => size.set({ w: innerWidth, h: innerHeight });
  window.addEventListener("resize", onResize);

  // 3. зарегистрировать уборку — дерево владения вызовет её при размонтировании
  onCleanup(() => window.removeEventListener("resize", onResize));

  return size;
}
```

Используется как обычное значение:

```tsx
function StatusBar() {
  const size = createWindowSize();
  return <footer>{size.map((s) => `${s.w}×${s.h}`)}</footer>;
}
```

Второй, реалистичный пример — персистентный стор со страницы
[паттернов](/ru/guides/patterns), упакованный в функцию:

```ts
import { stream } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";
import { persist, loadPersisted } from "@continuum-js/std";

export function createPersistedTodos(key: string) {
  const actions = stream<Action>();
  const todos = actions.accum<Todo[]>(loadPersisted(key, []), reduce);
  onCleanup(persist(key, todos));
  return { todos, dispatch: actions.fire };
}
```

Компонент сжимается до `const { todos, dispatch } = createPersistedTodos("todos")`.

## Единственное правило

**Зовите композабл синхронно во время построения компонента** (или внутри
`root()`/`scope()`) — именно тогда существует владелец, к которому можно
привязать уборку. Вызов из обработчика или `setTimeout` бросит обучающую
ошибку: некому было бы выполнить teardown.

Это вся дисциплина. Ни требований к порядку вызовов, ни «только верхний
уровень», ни массивов зависимостей. Условные вызовы легальны:

```ts
function Widget(props: { live: boolean }) {
  // совершенно законно — это НЕ React
  const data = props.live ? createPolling("/api") : constant(null);
  ...
}
```

## Как тестировать композабл

`root()` даёт владельца вне компонента:

```ts
import { root } from "@continuum-js/dom";

test("createWindowSize следит за ресайзом", () => {
  root((dispose) => {
    const size = createWindowSize();
    window.dispatchEvent(new Event("resize"));
    expect(size.sample().w).toBe(window.innerWidth);
    dispose(); // выполняет уборку композабла
  });
});
```
