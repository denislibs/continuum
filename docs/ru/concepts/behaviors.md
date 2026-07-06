# Behaviors

`Behavior<A>` — **значение во времени**. Денотационно это функция
`Time → A`: в каждый момент у него есть значение — всегда можно спросить
«какое сейчас?», и никогда — «пришло ли?».

## Создание

```ts
import { newBehavior, constant, Behavior } from "@continuum-js/frp";

const [name, setName] = newBehavior(""); // внешний сеттер
const count = clicks.accum(0, (_e, n) => n + 1); // свёртка события
const latest = responses.hold(null); // последнее вхождение
const pi = constant(3.14159); // не меняется никогда
const now = Behavior.fromPoll(() => Date.now()); // читать мир при sample
```

`newBehavior` — люк для состояния, управляемого извне. Когда есть поток
причин, предпочитайте свёртку (`accum`, `hold`) — история состояния остаётся
читаемой.

## Производные

Производные значения строятся через `map` и `lift`, и структура выражения —
это и _есть_ граф зависимостей:

```ts
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const label = Behavior.lift2((t, c) => `${t} ${c}`, total, currency);
```

Если значение вычислимо из существующих Behaviors — не храните его,
выводите. `Behavior.apply`, `lift2`, `lift3` комбинируют несколько
источников; вывод свободен от глитчей (см.
[Транзакции](/ru/concepts/transactions)).

## Чтение

- **В JSX** — кладите сам Behavior: `{count}`, `class={cls}`. Это привязка,
  а не снимок.
- **Из события** — `snapshot`; у него точная семантика одновременности.
- **Вне сети** (инициализация, тесты, интеграции) — `b.sample()` возвращает
  текущее значение.

```ts
const submitted = submits.snapshot(draft, (_e, text) => text);
```

## Updates

`b.updates` — это `Event<A>` изменений Behavior, мост обратно в мир событий;
им пользуются комбинаторы вроде `debounce(query.updates, 300)`.

Behavior обновляется **на границе момента**: внутри транзакции, которая его
меняет, читатели видят старое значение. Именно эта задержка делает
одновременные чтения определёнными — вся история в
[Транзакциях](/ru/concepts/transactions).
