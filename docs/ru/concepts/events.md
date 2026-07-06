# Events

`Event<A>` — поток **дискретных вхождений**: в какие-то моменты происходит
что-то со значением `A`, между ними не существует ничего. Денотационно —
`[(Time, A)]`.

## Создание

```ts
import { newEvent, never } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

const [clicks, fire] = newEvent<MouseEvent>(); // fire() впрыскивает вхождение
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
const delta = Event.merge(increments, decrements, (a, b) => a + b);
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
const totals = amounts.accumE(0, (a, s) => s + a); // Event шагов свёртки
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
