# Формы

## Контролируемый инпут

`bindInput` связывает `Behavior<string>` с полем в обе стороны:

```tsx
import { newBehavior } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";

const [name, setName] = newBehavior("");
<input {...bindInput(name, setName)} />;
```

Под капотом это просто `{ value: name, onInput: (e) => setName(…) }` —
никакой магии, при желании пишется вручную (например, чтобы нормализовать
ввод: `setName(v.trimStart())`).

## Валидация — производное значение

Ошибки не хранятся — они вычисляются:

```tsx
const emailError = email.map((v) =>
  v === "" ? null : /@/.test(v) ? null : "нужен адрес с @",
);
const formValid = Behavior.lift2(
  (e1, e2) => e1 === null && e2 === null,
  emailError,
  nameError,
);

<span class="error">{emailError.map((e) => e ?? "")}</span>
<button disabled={formValid.map((v) => !v)}>Отправить</button>;
```

Состояния «touched/dirty», если нужны, — это свёртка событий:
`blurs.once().mapTo(true).hold(false)`.

## Сабмит: `snapshot` собирает форму

Кнопка порождает событие; значения полей оно _захватывает_ в момент клика:

```tsx
const [submits, fireSubmit] = newEvent<void>();

const payload = submits
  .gate(formValid) // игнорировать сабмит невалидной формы
  .snapshot(
    Behavior.lift2((n, e) => ({ name: n, email: e }), name, email),
    (_click, form) => form,
  );

const results = perform(payload, (form) => api.register(form));

<form
  onSubmit={(e: SubmitEvent) => {
    e.preventDefault();
    fireSubmit();
  }}
>
  …
</form>;
```

Разбор по строкам:

- `gate(formValid)` — событие проходит, только пока Behavior истинен;
  «дизейбл» продублирован семантически, а не только в атрибуте кнопки;
- `snapshot` берёт значения полей _на момент_ сабмита — никакого чтения
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
    setName("");
    setEmail("");
  }),
);
```

`listen` возвращает функцию отписки — передайте её в `onCleanup`, чтобы
подписка умерла вместе с поддеревом. (Привязки в JSX делают это сами;
явный `listen` — ручной люк, и уборка у него тоже явная.)

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
