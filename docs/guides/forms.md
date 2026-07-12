# Forms

::: tip In plain words
Inputs, validation, submit: field values are reactive, errors are computed, the form is captured at the moment of submission.
:::

## A controlled input

`bindInput` binds a `State<string>` to a field both ways:

```tsx
import { state } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";

const name = state("");
<input {...bindInput(name, name.set)} />;
```

Under the hood it is just `{ value: name, onInput: (e) => name.set(…) }` — no
magic; write it by hand when you want to normalize input
(`name.set(v.trimStart())`).

## Validation is a derived value

Errors aren't stored — they are computed:

```tsx
import { combine } from "@continuum-js/frp";

const emailError = email.map((v) =>
  v === "" ? null : /@/.test(v) ? null : "an address with @ is required",
);
const formValid = combine(
  emailError,
  nameError,
  (e1, e2) => e1 === null && e2 === null,
);

<span class="error">{emailError.map((e) => e ?? "")}</span>
<button disabled={formValid.map((v) => !v)}>Submit</button>;
```

If you need "touched/dirty" states, they are folds over events:
`blurs.once().mapTo(true).hold(false)`.

## Submit: `at` assembles the form

The button produces an event; it _captures_ the field values at the moment
of the click:

```tsx
const submits = stream<void>();

const form = combine(name, email, (n, e) => ({ name: n, email: e }));
const payload = form.at(
  submits.when(formValid), // ignore submits of an invalid form
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

Line by line:

- `when(formValid)` — the event passes only while the state is true; the
  "disabled" is duplicated semantically, not just in the button attribute;
- `at` takes the field values _at the moment_ of submit — no reading
  from the DOM or from state inside a handler;
- `perform` carries the form into IO; the result comes back as an event (see
  the async guide).

## Clearing after success

The server response is an event; success is the trigger to reset the fields:

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

`listen` returns an unsubscribe function — hand it to `onCleanup` so the
subscription dies with the subtree. (JSX bindings do this by themselves; an
explicit `listen` is a manual hatch, and its cleanup is manual too.)

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
