# Forms

## A controlled input

`bindInput` wires a `Behavior<string>` to a field both ways:

```tsx
import { newBehavior } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";

const [name, setName] = newBehavior("");
<input {...bindInput(name, setName)} />;
```

Under the hood it is just `{ value: name, onInput: (e) => setName(…) }` — no
magic; write it by hand when you want to normalize input
(`setName(v.trimStart())`).

## Validation is a derived value

Errors aren't stored — they are computed:

```tsx
const emailError = email.map((v) =>
  v === "" ? null : /@/.test(v) ? null : "an address with @ is required",
);
const formValid = Behavior.lift2(
  (e1, e2) => e1 === null && e2 === null,
  emailError,
  nameError,
);

<span class="error">{emailError.map((e) => e ?? "")}</span>
<button disabled={formValid.map((v) => !v)}>Submit</button>;
```

If you need "touched/dirty" states, they are folds over events:
`blurs.once().mapTo(true).hold(false)`.

## Submit: `snapshot` assembles the form

The button produces an event; it _captures_ the field values at the moment
of the click:

```tsx
const [submits, fireSubmit] = newEvent<void>();

const payload = submits
  .gate(formValid) // ignore submits of an invalid form
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

Line by line:

- `gate(formValid)` — the event passes only while the Behavior is true; the
  "disabled" is duplicated semantically, not just in the button attribute;
- `snapshot` takes the field values _at the moment_ of submit — no reading
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
    setName("");
    setEmail("");
  }),
);
```

`listen` returns an unsubscribe function — hand it to `onCleanup` so the
subscription dies with the subtree. (JSX bindings do this by themselves; an
explicit `listen` is a manual hatch, and its cleanup is manual too.)

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
