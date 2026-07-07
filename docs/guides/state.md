# State and derived values

::: tip In plain words
Creating state and computing other values from it — no hooks, no dependency arrays.
:::

## Two ways to create state

**`newBehavior`** — the default: a value plus a setter, changed from
handlers. If you know `useState`, this is it (minus the re-runs):

```tsx
import { newBehavior } from "@continuum-js/frp";

const [theme, setTheme] = newBehavior<"light" | "dark">("light");
<button onClick={() => setTheme("dark")}>dark</button>;
```

**`newEvent` + `accum`** — the stream form, for when state is naturally a
fold over things that happened:

```ts
import { newEvent } from "@continuum-js/frp";

const [clicks, fire] = newEvent<MouseEvent>();
const count = clicks.accum(0, (_e, n) => n + 1);
```

Start with `newBehavior` — it covers most UI state. The fold form pays off
when a value has many independent sources of change or when you want its
history spelled out ("count _is_ the number of clicks"); it composes
directly with stream tools like `debounce` and `snapshot`.

## Derived values — only `map`/`lift`

Anything computable from existing Behaviors **must not be stored**:

```ts
import { Behavior } from "@continuum-js/frp";

const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const label = Behavior.lift2(
  (t, cur) => `${t.toFixed(2)} ${cur}`,
  total,
  currency,
);
```

The anti-pattern is "compute and write back with a setter":

```ts
// BAD: now you must remember to update total on every change of items
const [total, setTotal] = newBehavior(0);
itemsChanged.listen(() => setTotal(computeTotal()));
```

That is manual synchronization — exactly what FRP removes. The rule: if a
value is derivable, it is a `map`; `newBehavior` is for primary facts only.

## Reading the current value

- In JSX a Behavior is placed as is — `{count}` is a binding.
- In an event handler, use `snapshot`, not `sample`:

```ts
const submitted = submitClicks.snapshot(draft, (_e, text) => text);
```

`b.sample()` exists and honestly returns the current value, but it has no
simultaneity semantics: two simultaneous events would see "some" value
depending on ordering. `snapshot` is defined exactly: the value _before_ the
current moment. The practical rule: `sample` for code outside the network
(initialization, tests, integrations), `snapshot` inside it.

## Suppressing redundant updates

`distinctB` from `@continuum-js/std` drops consecutive equal values — useful
in front of `dyn`/`Show` so a subtree isn't rebuilt for nothing:

```ts
import { distinctB } from "@continuum-js/std";

const page = distinctB(location().map((u) => u.pathname.split("/")[1]));
```

## State outside components

Behaviors are plain objects: declare them at module level and import them.
That is how the router's `location()` works — one singleton Behavior per
page. A component's local state lives in its body and dies with the subtree
(see [Ownership and lifecycle](/concepts/ownership)).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
