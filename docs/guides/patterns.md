# Patterns

::: tip In plain words
A cookbook. Twenty-two recipes from "every app needs this" to "niche but
delightful" — each one is a small, complete idea you can lift into your code.
Skim the headings, steal what you need.
:::

The recipes assume the basics: [state](/guides/state),
[async](/guides/async), [events vs states](/concepts/events). Imports are
shown once per snippet; everything comes from `@continuum-js/frp`,
`@continuum-js/dom` or `@continuum-js/std`.

## State

### 1. Actions — Redux without Redux

**When:** one piece of state, many kinds of changes (add / remove / toggle…).

Give each kind of change its own event and declare the transitions right on
the state. Each reducer is `(state, event) => next` — `useReducer`, minus the
dispatch ceremony:

```tsx
import { state, stream } from "@continuum-js/frp";

const adds = stream<string>();
const removes = stream<string>();
const toggles = stream<string>();

const todos = state<Todo[]>([])
  .on(adds, (acc, text) => [...acc, createTodo(text)])
  .on(removes, (acc, id) => acc.filter((t) => t.id !== id))
  .on(toggles, (acc, id) =>
    acc.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  );

<button onClick={() => removes.fire(t.id)}>×</button>;
```

All list logic reads top-to-bottom in one place, and every change is a value
you can log, replay or test. When the changes themselves must be data — one
serializable log to replay or persist — collect them into a single
`Stream<Action>` and fold it with `accum` instead; the next recipe does
exactly that.

### 2. Undo / redo

**When:** you want history for free.

This is where a single action stream beats separate events: fold the _same_
stream into a history instead of a plain value:

```ts
import { stream } from "@continuum-js/frp";

type Hist = { past: Todo[][]; present: Todo[] };

const actions = stream<Action>();

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
const items = state<Item[]>([]);
const total = state(0); // forget to update this once — bug

// ✅ one source, the rest is arithmetic
const items = state<Item[]>([]);
const total = items.map((xs) => xs.reduce((s, i) => s + i.price, 0));
const isEmpty = items.map((xs) => xs.length === 0);
```

Deriving is free: no dependency arrays, no memo keys, no staleness.

### 4. A shared store in a module

**When:** several components across the app need the same state.

Values are formulas; state belongs to a scope. A source `state` and any pure
derivation are safe at module level as they are. A stateful fold (`.on`,
`accum`, `hold`) starts a process, and at module level you must say who owns
it — wrap it in `root()` (see [common
mistakes](/guides/common-mistakes) #7):

```ts
// store.ts
import { state, stream, root } from "@continuum-js/frp";

export const adds = stream<Item>();

// state with transitions — root() declares its lifetime (the page's)
export const cart = root(() =>
  state<Item[]>([]).on(adds, (xs, item) => [...xs, item]),
);

// a pure derivation is a formula: no owner, no ceremony
export const cartTotal = cart.map((xs) => xs.reduce((s, i) => s + i.price, 0));
```

A plain `state()` that you only `.set` from handlers needs no `root()` —
only stateful folds and effects do.

## Streams as algebra

### 5. Read state at the moment of an event — `at`

**When:** a handler needs "the value as of this click".

```ts
// submit the current draft, then clear it
const submitted = draft.at(submits);
```

Pass a combiner when the event's payload matters too:
`draft.at(submits, (text, click) => …)` receives `(value, event)`. Remember
the [hold delay](/concepts/transactions): within one moment you read the
value from _before_ the moment — that's what makes this composable.

### 6. Pause a stream — `when`

**When:** ignore input while something is in flight.

```ts
const saving = state(false);
const effectiveClicks = saveClicks.when(saving.map((s) => !s));
```

The stream simply has no occurrences while the condition is false —
downstream code doesn't need `if (saving) return` sprinkled everywhere.

### 7. Only changes — `distinct` / `distinctB`

**When:** a noisy source repeats the same value.

```ts
import { distinct } from "@continuum-js/frp";
import { distinctB } from "@continuum-js/std";

const realMoves = distinct(moves); // Stream: drop consecutive equals
const stableTheme = distinctB(theme); // State: suppress no-op updates
```

`distinctB` is how you stop a `dyn`/`<Dynamic>` region from rebuilding on
same-value writes.

### 8. Previous + current — `pairwise` and `previous`

**When:** direction of change matters (scroll up vs down, trend arrows).

```ts
import { combine } from "@continuum-js/frp";
import { pairwise, previous } from "@continuum-js/std";

const direction = pairwise(scrollY).map(([prev, cur]) =>
  cur > prev ? "down" : "up",
);
const lastPrice = previous(price, 0); // State lagging one step behind
const trend = combine(price, lastPrice, (now, before) =>
  Math.sign(now - before),
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

// Stream<string> → Stream<number>, invalid input never enters the network
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

### 12. Multi-source state — `.on`

**When:** independent sources each change one value in their own way.

Declare one transition per source, right on the state:

```ts
const counter = state(0)
  .on(plusClicks, (n) => n + 1)
  .on(minusClicks, (n) => n - 1)
  .on(resetClicks, () => 0);
```

No action types, no switch — each source carries its own semantics. If two
sources fire in the same moment, the transitions fold sequentially in
declaration order, and the state still delivers a single coalesced update
for that moment.

## Async

### 13. IO at the boundary — `perform` + `Result`

**When:** any effect. This is _the_ boundary pattern; everything async builds
on it.

```ts
import { perform } from "@continuum-js/frp";

const responses = perform(saveRequests, (todo) => api.save(todo));
// Stream<Result<unknown, Saved>> — errors are data, not throws

const [saved, failed] = partition(responses, (r) => r.ok);
```

### 14. Race-free search — `resource`

**When:** requests can arrive out of order (typeahead, filters).

```ts
import { resource } from "@continuum-js/std";

const results = resource(debounce(queries, 300), (q) =>
  fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
);
// State<Async<T>>: idle → loading → ok | error, last-request-wins built in

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

const userActions = stream<UserAction>();

const saves = perform(
  userActions.filter((a) => a.type === "add"),
  (a) => api.save(a),
);
const rollbacks: Stream<Action> = filterMap(saves, (r) =>
  r.ok ? null : { type: "rollback", id: r.error.id },
);

const todos = (userActions as Stream<Action>)
  .or(rollbacks)
  .accum<Todo[]>([], reduce);
```

There's no cycle: `perform` re-enters the network in a _new_ moment.

### 16. Polling with a pause switch

**When:** dashboards, notification counters.

```ts
import { interval } from "@continuum-js/std";

const live = state(true);
const ticks = interval(30_000).when(live);
const stats = resource(ticks, () => fetch("/api/stats").then((r) => r.json()));
```

Flip `live.set(false)` when the tab hides (an `onMount` +
`visibilitychange` listener) and the polling — and every request downstream —
stops as one.

## UI

### 17. Master–detail — `combine`

**When:** a selected id plus a list, and views of the chosen item.

```ts
import { combine } from "@continuum-js/frp";

const selectedId = state<string | null>(null);

const selected = combine(
  selectedId,
  todos,
  (id, xs) => xs.find((t) => t.id === id) ?? null,
);

<Show when={selected.map((s) => s !== null)} fallback={() => <PickSomething />}>
  {() => <Detail item={selected} />}
</Show>
```

`selected` can never disagree with the list: delete the selected item and the
detail pane closes by construction.

### 18. A source as a value — `flatten`

**When:** _which data source to use_ is itself state. The flagship niche
trick of classic FRP.

```ts
import { flatten } from "@continuum-js/frp";

const source: State<State<Todo[]>> = mode.map((m) =>
  m === "local" ? localTodos : serverTodos,
);
const todos = flatten(source);
// downstream code doesn't know or care that the source can be swapped
```

Everything built on `todos` — counts, filters, the `<Each>` — survives the
swap untouched. The same call flattens a state of event streams
(`State<Stream<A>> → Stream<A>`) — e.g. "which WebSocket am I listening to".

### 19. Modal — `<Show>` + `<Portal>`

```tsx
const open = state(false);

<Show when={open}>
  {() => (
    <Portal mount={document.body}>
      <div class="backdrop" onClick={() => open.set(false)}>
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
function Chart(props: { data: State<number[]> }) {
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

### 21. Persistence — `persist` + `loadPersisted`

**When:** state should survive a page reload (todos, drafts, UI preferences).

Persistence is a _sink at the boundary_: read once at creation, mirror every
change. Both halves ship in std — safe against corrupted JSON, missing
storage (SSR) and quota errors:

```ts
import { persist, loadPersisted } from "@continuum-js/std";

const todos = actions.accum<Todo[]>(loadPersisted("todos", []), reduce);
onCleanup(persist("todos", todos));
```

For chatty state, debounce the mirror; and since you already have an action
stream, cross-tab sync is just one more source that fires into it — the
browser fires `storage` in _other_ tabs on every write:

```ts
onMount(() => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === "todos" && e.newValue)
      actions.fire({ type: "replace", todos: JSON.parse(e.newValue) });
  };
  window.addEventListener("storage", onStorage);
  onCleanup(() => window.removeEventListener("storage", onStorage));
});
```

Add a todo in one tab — every tab updates, and the reducer didn't change by
a letter.

### 22. A shareable, polymorphic button — `ComponentProps`

**When:** one design-system component that renders as a `<button>` or as a
link, accepting exactly the right props for each.

`ComponentProps<"button">` gives you a tag's full typed attribute set (the
`React.ComponentProps` you're used to); a discriminated union on `as` picks
which set applies:

```tsx
import type { ComponentProps, Reactive } from "@continuum-js/dom";

type ButtonOwnProps = {
  variant?: "primary" | "secondary";
  loading?: Reactive<boolean>;
};

type ButtonProps =
  // `href?: never` closes a TS union hole: with the optional discriminant,
  // link props would otherwise be accepted on the button branch.
  | (ComponentProps<"button"> &
      ButtonOwnProps & { as?: "button"; href?: never })
  | (ComponentProps<"a"> & ButtonOwnProps & { as: "a" });

export function Button(props: ButtonProps) {
  const { as, variant = "primary", loading, ...rest } = props;
  const cls = `btn btn-${variant}`;
  return as === "a" ? (
    <a class={cls} {...(rest as ComponentProps<"a">)} />
  ) : (
    <button
      class={cls}
      disabled={loading}
      {...(rest as ComponentProps<"button">)}
    />
  );
}
```

```tsx
<Button type="submit" loading={saving} onClick={(e) => save(e)}>Save</Button>
<Button as="a" href="/docs" target="_blank">Docs</Button>
<Button href="/docs">…</Button> // ✗ compile error: href requires as="a"
```

Notes worth stealing:

- **children forward through the spread** — the runtime delivers them as
  `props.children`, so `{...rest}` carries them into the tag;
- `loading` is `Reactive<boolean>`: callers pass a plain `true` or a live
  `State<boolean>` and `disabled` tracks it — no wiring;
- handlers on the result are fully typed, including `e.currentTarget` (an
  `HTMLButtonElement` or `HTMLAnchorElement` per branch).

---

Want a recipe that isn't here? [Open an
issue](https://github.com/denislibs/continuum/issues) — the best patterns in
this list started as someone's "how do I…".
