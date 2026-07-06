# State and derived values

## Two ways to create state

**`newBehavior`** — when state is driven from outside (an imperative setter):

```ts
import { newBehavior } from "@continuum-js/frp";

const [theme, setTheme] = newBehavior<"light" | "dark">("light");
```

**`newEvent` + `accum`** — when state is a fold over what happens:

```ts
import { newEvent } from "@continuum-js/frp";

const [clicks, fire] = newEvent<MouseEvent>();
const count = clicks.accum(0, (_e, n) => n + 1);
```

Prefer the second whenever there is an explicit stream of causes: it keeps
the state's history readable ("count is the number of clicks") instead of
smeared across setter calls. The `setX` from `newBehavior` is a hatch for
places where there is no event to fold (initialization, integrating external
code).

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
