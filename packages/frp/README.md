# @continuum-js/frp

Ядро классического FRP: `Stream`, `State` и транзакционный планировщик с
ранговой протяжкой без глитчей. Не зависит от DOM — пригодно для игр, потоков,
анимации, серверной логики.

```ts
import { root, stream, state } from "@continuum-js/frp";

const clicks = stream<void>();
// Состояние живёт в скоупе: внутри компонента он есть автоматически,
// на уровне модуля объявляем его явно через root().
const count = root(() => state(0).on(clicks, (n) => n + 1));
count.listen((n) => console.log(n)); // 0, 1, 2, ...
clicks.fire();
clicks.fire();
```

- **Stream** — дискретные происшествия (push): `map`, `filter`, `when`,
  `merge`, `or`, `accum`/`accumE`, `hold`, `once`, `listen`.
- **State** — значение во времени (pull) + `updates`: `map`, `at`
  (значение состояния в моменты потока), `combine` (поточечное соединение),
  `flatten` (переключение state-of-states / state-of-streams), `fromPoll`.
  За момент ячейка доставляет одно коалесцированное вхождение `updates`.
- Источники: `stream()` c `.fire`, `state(init)` c `.set` и декларативными
  переходами `.on(e, (state, event) => next)`; `constant`, `never`, `time`.
- Эффекты и дедуп: `perform` (граница IO, `Result`), `distinct`.

Гарантии: консистентность момента (glitch-free), детерминизм совпадений,
FIFO-порядок наблюдателей, задержка `hold` на границе момента, изоляция ошибок
в фазе post.
