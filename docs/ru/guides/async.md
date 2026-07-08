# Асинхронность

::: tip Простыми словами
Как загружать данные, показывать состояния «грузится» и «ошибка» и никогда не ловить гонку ответов.
:::

Сеть FRP чистая и синхронная: момент закрывается, эффекты — после него.
Асинхронный мир входит и выходит через два люка.

## `perform`: IO как данные

`perform` превращает событие запросов в событие результатов. Промис
исполняется _после_ закрытия момента; его результат открывает **новый**
момент. Ошибка — не исключение, а ветка `Result`:

```ts
import { perform, type Result } from "@continuum-js/frp";

const results = perform(saveClicks, (draft) => api.save(draft));
// Stream<Result<unknown, SaveResponse>>

const saved = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);
```

Обе ветки — обычные события: их можно `merge`, копить `accum`, показывать
через `hold`.

## `resource`: конечный автомат загрузки

Для типового «загрузи по триггеру и покажи» есть `resource` из
`@continuum-js/std`:

```tsx
import { resource } from "@continuum-js/std";
import { Dynamic } from "@continuum-js/dom";

const state = resource(userId.updates, (id) => api.fetchUser(id));
// Behavior<Async<User>>: { status: "idle" | "loading" | "ok" | "error" }

<Dynamic value={state}>
  {(s) =>
    s.status === "loading" ? (
      <Spinner />
    ) : s.status === "error" ? (
      <ErrorBox error={s.error} />
    ) : s.status === "ok" ? (
      <Profile user={s.value} />
    ) : null
  }
</Dynamic>;
```

Ключевое: **гонка ответов решена внутри**. Запросы нумеруются; ответ на
устаревший запрос игнорируется (last-request-wins). Классический баг
«быстрый ответ на старый запрос перетёр свежий» не воспроизводим по
построению — в React это ручной `cancelled`-флажок в каждом `useEffect`.

## Debounce-поиск: композиция вместо хука

Комбинаторы событий и `resource` собираются как конструктор:

```ts
import { debounce } from "@continuum-js/std";

const settled = debounce(query.updates, 300); // Stream<string>
const results = resource(settled, (q) => api.search(q));
```

Ни кастомного хука, ни таймеров в компоненте: `debounce` — чистый оператор
над событием, `resource` — автомат над результатами.

## Таймеры

`interval(ms)` из std — событие тиков; `delay(e, ms)` — сдвиг события во
времени. Их таймеры останавливаются при `dispose()` события — в компоненте
привяжите это к дереву владения явно:

```ts
import { interval } from "@continuum-js/std";
import { onCleanup } from "@continuum-js/dom";

const ticks = interval(1000);
onCleanup(() => ticks.dispose());
```

Для анимаций есть `animationFrames()` из dom — он регистрируется во
владельце сам — и непрерывное время (`integral`/`warp`) из ядра; см.
[гайд по анимации](/ru/guides/animation).

## Правило одного направления

Асинхронный код никогда не «дописывает» состояние сам — он всегда порождает
_событие_, которое сеть сворачивает обычными средствами (`hold`, `accum`,
`resource`). Если хочется вызвать `set` из `.then()` — скорее всего, это
место для `perform`.

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
