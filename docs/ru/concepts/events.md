# Streams

`Stream<A>` — поток **происшествий**: клики, нажатия клавиш, ответы сервера.
Каждое срабатывание ([вхождение](/ru/glossary#occurrence)) несёт значение;
между срабатываниями события просто нет — в отличие от
[Wire](/ru/concepts/behaviors), у него нельзя прочитать «текущее значение».

::: tip Возможно, Streams вам пока не нужны
Для большинства UI-кода хватает `wire` + обычных колбэков
(`onClick={() => x.set(…)}`). За Streams идите, когда суть задачи — сам
поток: debounce ввода, слияние источников, захват формы на сабмите,
подача запросов в `resource`.

Проверка одной фразой: если это можно **нарисовать на экране** — это
[Wire](/ru/concepts/behaviors); если на это можно **среагировать** —
Stream. Длинная версия:
[Чем Stream отличается от Behavior](/ru/frp-in-plain-words#event-vs-behavior).
:::

## Создание

```ts
import { stream, never } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

const clicks = stream<MouseEvent>(); // clicks.fire() впрыскивает вхождение
const ticks = interval(1000); // 1, 2, 3, … каждую секунду
const nothing = never<string>(); // не происходит никогда
```

В JSX `onClick={clicks.fire}` отправляет DOM-событие прямо в сеть.

## Преобразования

```ts
const ids = clicks.map((e) => (e.target as HTMLElement).id);
const lefts = clicks.filter((e) => e.button === 0);
const ones = clicks.mapTo(1);
const firstOnly = clicks.once();
const whileOpen = keys.when(isOpen); // проходит, только пока Wire истинен
```

## Комбинирование

`merge` сворачивает **одновременные** вхождения явной функцией — никакого
«левое побеждает случайно»:

```ts
const delta = Stream.merge(increments, decrements, (a, b) => a + b);
const either = errors.or(fallbacks); // лево-приоритетное сокращение
```

## Захват состояния

`b.at(e)` читает Wire в момент события; `when` фильтрует по нему:

```ts
const submitted = draft.at(submits); // значение draft на момент сабмита
```

Форма с функцией — `draft.at(submits, (text, e) => …)` — получает сначала
значение, затем само вхождение.

## Превращение в состояние

```ts
// на уровне модуля состоянию нужен владелец — оберните определение в root()
const latest = root(() => responses.hold(initial)); // Wire: последнее значение
const count = root(() => clicks.accum(0, (_e, n) => n + 1)); // Wire: свёртка
const totals = root(() => amounts.accumE(0, (a, s) => s + a)); // Stream шагов свёртки
```

Внутри компонента `root()` не нужен — скоуп-владелец там есть
автоматически. А когда одна ячейка сводит несколько потоков, идиоматичнее
объявить переходы прямо на ней:

```ts
const count = wire(0)
  .on(inc, (n) => n + 1)
  .on(dec, (n) => n - 1)
  .on(reset, () => 0);
```

`hold`/`accum` обновляются на границе момента — внутри транзакции самого
вхождения читатели видят предыдущее значение. Почему это фича, а не баг —
в [Транзакциях](/ru/concepts/transactions).

## Прослушивание (выходной люк)

`e.listen(handler)` выполняет обработчик после закрытия момента и возвращает
функцию отписки. В дереве владения она **не** регистрируется автоматически —
в компоненте оборачивайте:

```ts
onCleanup(e.listen(handler));
```

Предпочитайте привязки, `at` и свёртки; `listen` — только на краю сети
(логирование, императивные API, IO — см. [perform](/ru/guides/async)).

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
