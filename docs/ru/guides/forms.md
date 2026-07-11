# Формы

::: tip Простыми словами
Инпуты, валидация и сабмит: значения полей — реактивные, ошибки — вычисляются, форма собирается в момент отправки.
:::

## Контролируемый инпут

`bindInput` связывает `Wire<string>` (Wire — «провод», реактивное значение;
в FRP-литературе Behavior) с полем в обе стороны:

```tsx
import { wire } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";

const name = wire("");
<input {...bindInput(name, name.set)} />;
```

Под капотом это просто `{ value: name, onInput: (e) => name.set(…) }` —
никакой магии, при желании пишется вручную (например, чтобы нормализовать
ввод: `name.set(v.trimStart())`).

## Валидация — производное значение

Ошибки не хранятся — они вычисляются:

```tsx
const emailError = email.map((v) =>
  v === "" ? null : /@/.test(v) ? null : "нужен адрес с @",
);
const formValid = combine(
  emailError,
  nameError,
  (e1, e2) => e1 === null && e2 === null,
);

<span class="error">{emailError.map((e) => e ?? "")}</span>
<button disabled={formValid.map((v) => !v)}>Отправить</button>;
```

Состояния «touched/dirty», если нужны, — это свёртка событий:
`blurs.once().mapTo(true).hold(false)`.

## Сабмит: `at` собирает форму

Кнопка порождает событие; значения полей оно _захватывает_ в момент клика:

```tsx
const submits = stream<void>();

const form = combine(name, email, (n, e) => ({ name: n, email: e }));
const payload = form.at(
  submits.when(formValid), // игнорировать сабмит невалидной формы
);

const results = perform(payload, (form) => api.register(form));

<form
  onSubmit={(e: SubmitEvent) => {
    e.preventDefault();
    submits.fire();
  }}
>
  …
</form>;
```

Разбор по строкам:

- `when(formValid)` — событие проходит, только пока Wire истинен;
  «дизейбл» продублирован семантически, а не только в атрибуте кнопки;
- `at` берёт значения полей _на момент_ сабмита — никакого чтения
  из DOM или стейта в обработчике;
- `perform` уводит форму в IO, результат возвращается событием (см. гайд
  об асинхронности).

## Очистка после успеха

Ответ сервера — событие; успех — повод сбросить поля:

```ts
import { onCleanup } from "@continuum-js/dom";

const saved = results.filter((r) => r.ok);
onCleanup(
  saved.listen(() => {
    name.set("");
    email.set("");
  }),
);
```

`listen` возвращает функцию отписки — передайте её в `onCleanup`, чтобы
подписка умерла вместе с поддеревом. (Привязки в JSX делают это сами;
явный `listen` — ручной люк, и уборка у него тоже явная.)

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
