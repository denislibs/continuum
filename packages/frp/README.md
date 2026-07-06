# @continuum-js/frp

Ядро классического FRP: `Event`, `Behavior` и транзакционный планировщик с
ранговой протяжкой без глитчей. Не зависит от DOM — пригодно для игр, потоков,
анимации, серверной логики.

```ts
import { newEvent } from "@continuum-js/frp";

const [clicks, fire] = newEvent<void>();
const count = clicks.accum(0, (_, n) => n + 1);
count.listen((n) => console.log(n)); // 0, 1, 2, ...
fire();
fire();
```

- **Event** — дискретные происшествия (push): `map`, `filter`, `gate`,
  `snapshot`, `merge`, `orElse`, `accum`/`accumE`, `hold`, `once`, `listen`.
- **Behavior** — значение во времени (pull) + `updates`: `map`, `apply`,
  `lift2`/`lift3`, `switchB`/`switchE`, `fromPoll`.
- Источники: `newEvent`, `newBehavior`, `constant`, `never`, `time`.
- Эффекты и дедуп: `perform` (граница IO, `Result`), `distinct`.

Гарантии: консистентность момента (glitch-free), детерминизм совпадений,
FIFO-порядок наблюдателей, задержка `hold` на границе момента, изоляция ошибок
в фазе post.
