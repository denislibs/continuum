# Streams

`Stream<A>` — поток **происшествий**: клики, нажатия клавиш, ответы сервера.
Каждое срабатывание ([вхождение](/ru/glossary#occurrence)) несёт значение;
между срабатываниями события просто нет — в отличие от Behavior, у него
нельзя прочитать «текущее значение».

::: tip Возможно, Streams вам пока не нужны
Для большинства UI-кода хватает `newBehavior` + обычных колбэков
(`onClick={() => setX(…)}`). За Streams идите, когда суть задачи — сам
поток: debounce ввода, слияние источников, захват формы на сабмите,
подача запросов в `resource`.

Проверка одной фразой: если это можно **нарисовать на экране** — это
[Behavior](/ru/concepts/behaviors); если на это можно **среагировать** —
Stream. Длинная версия:
[Чем Stream отличается от Behavior](/ru/frp-in-plain-words#event-vs-behavior).
:::

## Создание

```ts
import { newStream, never } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

const [clicks, fire] = newStream<MouseEvent>(); // fire() впрыскивает вхождение
const ticks = interval(1000); // 1, 2, 3, … каждую секунду
const nothing = never<string>(); // не происходит никогда
```

В JSX `onClick={fire}` отправляет DOM-событие прямо в сеть.

## Преобразования

```ts
const ids = clicks.map((e) => (e.target as HTMLElement).id);
const lefts = clicks.filter((e) => e.button === 0);
const ones = clicks.mapTo(1);
const firstOnly = clicks.once();
const whileOpen = keys.gate(isOpen); // проходит, только пока Behavior истинен
```

## Комбинирование

`merge` сворачивает **одновременные** вхождения явной функцией — никакого
«левое побеждает случайно»:

```ts
const delta = Stream.merge(increments, decrements, (a, b) => a + b);
const either = errors.orElse(fallbacks); // лево-приоритетное сокращение
```

## Захват состояния

`snapshot` читает Behavior в момент события; `gate` фильтрует по нему:

```ts
const submitted = submits.snapshot(draft, (_e, text) => text);
```

## Превращение в состояние

```ts
const latest = responses.hold(initial); // Behavior: последнее значение
const count = clicks.accum(0, (_e, n) => n + 1); // Behavior: свёртка
const totals = amounts.accumE(0, (a, s) => s + a); // Stream шагов свёртки
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

Предпочитайте привязки, `snapshot` и свёртки; `listen` — только на краю сети
(логирование, императивные API, IO — см. [perform](/ru/guides/async)).

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
