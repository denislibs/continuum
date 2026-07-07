# Patterns

::: tip In plain words
A cookbook. Twenty recipes from "every app needs this" to "niche but
delightful" — each one is a small, complete idea you can lift into your code.
Skim the headings, steal what you need.
:::

The recipes assume the basics: [state](/guides/state),
[async](/guides/async), [events vs behaviors](/concepts/events). Imports are
shown once per snippet; everything comes from `@continuum-js/frp`,
`@continuum-js/dom` or `@continuum-js/std`.

## State

### 1. Actions — Redux without Redux

**When:** one piece of state, many kinds of changes (add / remove / toggle…).

Collect every change into a single `Event<Action>` and fold it with one pure
reducer. `accum` _is_ the store; you just don't need the library.

```tsx
type Action =
  | { type: "add"; text: string }
  | { type: "remove"; id: string }
  | { type: "toggle"; id: string };

const [actions, dispatch] = newEvent<Action>();

const todos = actions.accum<Todo[]>([], (a, acc) => {
  switch (a.type) {
    case "add":
      return [...acc, createTodo(a.text)];
    case "remove":
      return acc.filter((t) => t.id !== a.id);
    case "toggle":
      return acc.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t));
  }
});

<button onClick={() => dispatch({ type: "remove", id: t.id })}>×</button>;
```

All list logic reads top-to-bottom in one place, and every change is a value
you can log, replay or test.

### 2. Undo / redo

**When:** you already have the actions pattern and want history for free.

Fold the _same_ action stream into a history instead of a plain value:

```ts
type Hist = { past: Todo[][]; present: Todo[] };

const history = actions.accum<Hist>({ past: [], present: [] }, (a, h) => {
  if (a.type === "undo") {
    const prev = h.past.at(-1);
    return prev ? { past: h.past.slice(0, -1), present: prev } : h;
  }
  return { past: [...h.past, h.present], present: reduce(a, h.present) };
});
const todos = history.map((h) => h.present);
const canUndo = history.map((h) => h.past.length > 0);
```

One stream of actions, several folds over it — this is the point where FRP
starts paying rent.

### 3. Never store what you can derive

**When:** you're tempted to `set` two things from one handler.

Two stored values that must agree will eventually disagree. Store the
_source_ fact; compute the rest:

```ts
// ❌ two sources of truth that must be kept in sync by hand
const [items, setItems] = newBehavior<Item[]>([]);
const [total, setTotal] = newBehavior(0); // forget to update this once — bug

// ✅ one source, the rest is arithmetic
const [items, setItems] = newBehavior<Item[]>([]);
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const isEmpty = items.map((xs) => xs.length === 0);
```

Deriving is free: no dependency arrays, no memo keys, no staleness.

### 4. A shared store in a module

**When:** several components across the app need the same state.

Sources are pinned automatically; a module-level _derivation_ must opt out of
auto-disposal with `.retain()` (see [common
mistakes](/guides/common-mistakes) #7):

```ts
// store.ts
export const [cart, setCart] = newBehavior<Item[]>([]);
export const cartTotal = cart
  .map((xs) => xs.reduce((s, i) => s + i.price, 0))
  .retain(); // shared derivation outlives any single component
```

## Events as algebra

### 5. Read state at the moment of an event — `snapshot`

**When:** a handler needs "the value as of this click".

```ts
// submit the current draft, then clear it
const submitted = submits.snapshot(draft, (_e, text) => text);
```

`sampleWith(trigger, b)` from std is the same thing when you don't need the
trigger's payload. Remember the [hold delay](/concepts/transactions): within
one moment you read the value from _before_ the moment — that's what makes
this composable.

### 6. Pause a stream — `gate`

**When:** ignore input while something is in flight.

```ts
const [saving, setSaving] = newBehavior(false);
const effectiveClicks = saveClicks.gate(saving.map((s) => !s));
```

The stream simply has no occurrences while the gate is closed — downstream
code doesn't need `if (saving) return` sprinkled everywhere.

### 7. Only changes — `distinct` / `distinctB`

**When:** a noisy source repeats the same value.

```ts
import { distinct } from "@continuum-js/frp";
import { distinctB } from "@continuum-js/std";

const realMoves = distinct(moves); // Event: drop consecutive equals
const stableTheme = distinctB(theme); // Behavior: suppress no-op updates
```

`distinctB` is how you stop a `dyn`/`<Dynamic>` region from rebuilding on
same-value writes.

### 8. Previous + current — `pairwise` and `previous`

**When:** direction of change matters (scroll up vs down, trend arrows).

```ts
import { pairwise, previous } from "@continuum-js/std";

const direction = pairwise(scrollY).map(([prev, cur]) =>
  cur > prev ? "down" : "up",
);
const lastPrice = previous(price, 0); // Behavior lagging one step behind
const trend = Behavior.lift2(
  (now, before) => Math.sign(now - before),
  price,
  lastPrice,
);
```

### 9. Split a stream — `partition`

**When:** one source, two fates.

```ts
import { partition } from "@continuum-js/std";

const [oks, errs] = partition(responses, (r) => r.ok);
```

### 10. Parse, don't validate — `filterMap`

**When:** filter and transform are really one operation.

```ts
import { filterMap } from "@continuum-js/std";

// Event<string> → Event<number>, invalid input never enters the network
const amounts = filterMap(inputs, (s) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
});
```

Downstream of this line, bad values _cannot exist_ — the type says so.

### 11. Calm a firehose — `debounce` / `throttle`

**When:** keystrokes, scroll, resize.

```ts
import { debounce, throttle } from "@continuum-js/std";

const settledQuery = debounce(queryInput, 300); // after the user stops typing
const scrollSample = throttle(scrolls, 100); // at most 10/sec while active
```

### 12. Multi-source state — merge events of _functions_

**When:** the actions pattern feels heavy and sources are truly independent.

The niche-but-lovely trick: map each source to a _state-transforming
function_, merge, fold with application:

```ts
const increments = plusClicks.mapTo((n: number) => n + 1);
const decrements = minusClicks.mapTo((n: number) => n - 1);
const resets = resetClicks.mapTo((_: number) => 0);

const counter = increments
  .orElse(decrements)
  .orElse(resets)
  .accum(0, (f, n) => f(n));
```

No action types, no switch — each source carries its own semantics. Use
`Event.merge(l, r, (f, g) => (n) => g(f(n)))` instead of `orElse` if two
sources can genuinely fire in the same moment and both must apply.

## Async

### 13. IO at the boundary — `perform` + `Result`

**When:** any effect. This is _the_ boundary pattern; everything async builds
on it.

```ts
import { perform } from "@continuum-js/frp";

const responses = perform(saveRequests, (todo) => api.save(todo));
// Event<Result<unknown, Saved>> — errors are data, not throws

const [saved, failed] = partition(responses, (r) => r.ok);
```

### 14. Race-free search — `resource`

**When:** requests can arrive out of order (typeahead, filters).

```ts
import { resource } from "@continuum-js/std";

const results = resource(debounce(queries, 300), (q) =>
  fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
);
// Behavior<Async<T>>: idle → loading → ok | error, last-request-wins built in

<Dynamic value={results}>
  {(r) =>
    r.status === "loading" ? <Spinner />
    : r.status === "error" ? <Oops error={r.error} />
    : r.status === "ok" ? <List items={r.value} />
    : <Hint />}
</Dynamic>
```

The out-of-order-response bug is solved _inside_ `resource` by request
numbering — you can't reintroduce it.

### 15. Optimistic updates

**When:** the UI should react instantly and reconcile with the server later.

Apply the action locally at once; if the server refuses, a compensating
action flows back in through the same reducer:

```ts
type Action = UserAction | { type: "rollback"; id: string };

const [userActions, dispatch] = newEvent<UserAction>();

const saves = perform(
  userActions.filter((a) => a.type === "add"),
  (a) => api.save(a),
);
const rollbacks: Event<Action> = filterMap(saves, (r) =>
  r.ok ? null : { type: "rollback", id: r.error.id },
);

const todos = (userActions as Event<Action>)
  .orElse(rollbacks)
  .accum<Todo[]>([], reduce);
```

There's no cycle: `perform` re-enters the network in a _new_ moment.

### 16. Polling with a pause switch

**When:** dashboards, notification counters.

```ts
import { interval } from "@continuum-js/std";

const [live, setLive] = newBehavior(true);
const ticks = interval(30_000).gate(live);
const stats = resource(ticks, () => fetch("/api/stats").then((r) => r.json()));
```

Flip `setLive(false)` when the tab hides (an `onMount` +
`visibilitychange` listener) and the polling — and every request downstream —
stops as one.

## UI

### 17. Master–detail — `lift2`

**When:** a selected id plus a list, and views of the chosen item.

```ts
const [selectedId, select] = newBehavior<string | null>(null);

const selected = Behavior.lift2(
  (id, xs) => xs.find((t) => t.id === id) ?? null,
  selectedId,
  todos,
);

<Show when={selected.map((s) => s !== null)} fallback={() => <PickSomething />}>
  {() => <Detail item={selected} />}
</Show>
```

`selected` can never disagree with the list: delete the selected item and the
detail pane closes by construction.

### 18. A source as a value — `switchB`

**When:** _which data source to use_ is itself state. The flagship niche
trick of classic FRP.

```ts
const source: Behavior<Behavior<Todo[]>> = mode.map((m) =>
  m === "local" ? localTodos : serverTodos,
);
const todos = Behavior.switchB(source);
// downstream code doesn't know or care that the source can be swapped
```

Everything built on `todos` — counts, filters, the `<Each>` — survives the
swap untouched. The same shape with `Behavior.switchE` switches event
streams (e.g. "which WebSocket am I listening to").

### 19. Modal — `<Show>` + `<Portal>`

```tsx
const [open, setOpen] = newBehavior(false);

<Show when={open}>
  {() => (
    <Portal mount={document.body}>
      <div class="backdrop" onClick={() => setOpen(false)}>
        <dialog open>…</dialog>
      </div>
    </Portal>
  )}
</Show>;
```

Ownership does the cleanup: closing the modal disposes the portal's subtree
and every subscription inside it.

### 20. An imperative island — `ref` + `onMount` + `onCleanup`

**When:** wrapping a non-reactive library (a chart, a map, an editor).

```tsx
function Chart(props: { data: Behavior<number[]> }) {
  let el!: HTMLDivElement;
  onMount(() => {
    const chart = new ThirdPartyChart(el); // DOM is in the document here
    const un = props.data.listen((d) => chart.setData(d)); // reactive → imperative
    onCleanup(() => {
      un();
      chart.destroy();
    });
  });
  return <div ref={(e) => (el = e)} />;
}
```

The pattern is always the same three lines: create in `onMount`, bridge with
`listen`, tear down in `onCleanup`. Nothing leaks — the ownership tree calls
your cleanup when the component goes.

---

Want a recipe that isn't here? [Open an
issue](https://github.com/denislibs/continuum/issues) — the best patterns in
this list started as someone's "how do I…".
