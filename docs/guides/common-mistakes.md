# Common mistakes

::: tip In plain words
The nine ways a Continuum app most often "doesn't work" — what the symptom
looks like, why it happens, and the one-line fix. Bookmark this page for your
first week.
:::

## 1. Side effects inside `map` / `accum`

**Symptom:** works sometimes, breaks after refactoring; values are `null`
when you least expect it.

The functions you pass to `map`, `accum`, `filter`, `at`, `.on` must be
**pure**: take data, return data. Reading the DOM, firing other events,
`fetch`-ing — none of that belongs inside. The transactional guarantees
(atomic updates, no glitches) are built on this assumption.

```tsx
// ❌ reads the DOM inside a reducer
const todos = submits.accum<Todo[]>([], (e, acc) => {
  const input = (e.currentTarget as HTMLFormElement).elements.namedItem("todo");
  // `currentTarget` is only guaranteed to exist WHILE the event dispatches —
  // this happens to work today and breaks the day the timing changes.
  return [...acc, createTodo((input as HTMLInputElement).value)];
});
```

```tsx
// ✅ dirty work at the boundary, clean data into the network
const texts = stream<string>();
const todos = texts.accum<Todo[]>([], (text, acc) => [
  ...acc,
  createTodo(text),
]);

const onSubmit = (e: SubmitEvent) => {
  e.preventDefault();
  const input = (e.currentTarget as HTMLFormElement).elements.namedItem("todo");
  if (input instanceof HTMLInputElement && input.value.trim()) {
    texts.fire(input.value.trim());
    input.value = "";
  }
};
```

The rule of thumb: **handlers extract, the network transforms.** If a
reducer needs something from the DOM, that something should have been the
event's payload.

## 2. Forgetting `preventDefault()` on a form

**Symptom:** submitting a form "does nothing" — or the page flashes and all
state resets.

The browser's default for `submit` is a full page navigation. Your event
fires, your state updates — and a millisecond later the page reloads and
takes everything with it.

```tsx
// ❌ the page reloads, the app restarts from scratch
<form onSubmit={submits.fire}>

// ✅
<form onSubmit={(e) => { e.preventDefault(); submits.fire(e); }}>
```

This is browser behavior, not Continuum's — but "my todo doesn't get added"
is how it always looks.

## 3. `.sample()` in JSX

**Symptom:** the value renders once and never updates.

`sample()` reads the current value **right now** and returns a plain,
non-reactive result. A component runs once, so a sampled value is frozen
forever. Put the wire itself into JSX — that's the whole point:

```tsx
// ❌ renders the initial value, then never changes
<div>{count.sample()}</div>

// ✅ a live binding: this text node updates on every change
<div>{count}</div>
```

`sample()` belongs in **handlers**, where you need "the value at the moment
of the click":

```tsx
<button onClick={() => count.set(count.sample() + 1)}>+1</button>
```

## 4. A ternary instead of `<Show>`

**Symptom:** the condition is evaluated once and the branch never switches
(or the code doesn't typecheck at all).

A component runs once, so a plain `if`/ternary chooses a branch **once**.
Reactive branching is what `<Show>` (or `when`/`dyn`) is for:

```tsx
// ❌ `list` is a Wire — there is no `.length` on it,
// and even `list.sample().length` would only be checked once
{
  list.sample().length > 0 ? <TodoList /> : <Empty />;
}

// ✅ a derived condition + a reactive region
const hasItems = list.map((xs) => xs.length > 0);
<Show when={hasItems} fallback={() => <Empty />}>
  {() => <TodoList />}
</Show>;
```

Note both children are **thunks** (`() => …`). That's deliberate: eager JSX
would build both branches immediately; the thunk lets the framework build
only the live one.

## 5. `onChange` where you meant `onInput`

**Symptom:** the text state updates only when the field loses focus.

Continuum attaches **native** DOM listeners, and the native `change` event on
a text input fires on blur — not per keystroke. This is different from React,
which remaps `onChange`.

```tsx
// ❌ fires on blur
<input value={text} onChange={(e) => text.set((e.target as HTMLInputElement).value)} />

// ✅ fires per keystroke — or just use bindInput
<input value={text} onInput={(e) => text.set((e.target as HTMLInputElement).value)} />
<input {...bindInput(text, text.set)} />
```

## 6. Expecting `at` to see the new value in the same moment

**Symptom:** a value read "at the same time" as an update comes back as the
_previous_ value, and it looks like an off-by-one bug.

It isn't a bug — it's the **hold delay**, the core rule of the model: within
one moment, every wire still holds the value it had _before_ the moment.
The new value becomes visible after the moment closes. This is exactly what
makes state loops (`accum`, feedback through `hold`) well-defined instead of
infinite.

```ts
const src = stream<number>();
const held = src.hold(0);
const pairs = held.at(src, (prev, now) => [now, prev]);
src.fire(1); // pairs sees [1, 0] — `prev` is the value BEFORE this moment
src.fire(2); // pairs sees [2, 1]
```

If you need "the value including this update", derive it (`map`, `accum`,
`.on`) instead of reading it with `at`. The long version: [Transactions and
time](/concepts/transactions).

## 7. Module-level state without `root()`

**Symptom:** `Error: … creates state or an effect, and those need an owner`.

Values are formulas; state and effects belong to a scope. A pure derivation
(`map`, `combine`, `filter`, `at`) is a formula — share it at module level
freely, it needs no owner. But `hold`, `accum`, `.on`, `perform` (and
stateful std helpers like `resource` and `count`) start a **process**, and a
process must have an owner who eventually tears it down. Inside a component
that owner is the component's scope, automatically. At module level there is
none — so Continuum refuses to guess and asks you to declare the lifetime
explicitly:

```ts
// ❌ module level: no scope to own the fold — throws a teaching error
export const theme = settings.updates.hold(defaultTheme);

// ✅ app-level state: root() says "this lives as long as the page"
export const theme = root(() => settings.updates.hold(defaultTheme));
```

Inside components you never think about this. And `retain()` has nothing to
do with it — it is only a performance hint for hot shared formulas, never a
lifetime tool.

## 8. State frozen after its scope is disposed

**Symptom:** a value stops updating after a `<Show>` flips or a route
changes — `sample()` keeps returning the same last value forever.

State lives exactly as long as its owning scope. When a subtree is disposed,
every process it owned — `.on` transitions, `hold`, `accum`, `perform`
subscriptions — detaches. The wire doesn't die or throw: it freezes,
answering `sample()` with its final value and never updating again.

```tsx
// ❌ state owned by the Show branch: freezes every time the panel hides
<Show when={visible}>
  {() => {
    const n = wire(0).on(ticks, (x) => x + 1);
    return <Counter value={n} />;
  }}
</Show>
```

If a value must survive its component, create it higher up — in an ancestor
that outlives every reader, or at app level with `root()` (see #7). Where
state is declared _is_ how long it lives; that's the feature.

## 9. `fetch` inside `map`

**Symptom:** duplicated requests, unhandled rejections, race conditions on
fast typing.

`map` is for pure transformations. IO has a dedicated boundary: `perform`
(or `resource` from `@continuum-js/std`), which runs the effect **after** the
moment closes and returns the result as data — errors included, wrapped in
`Result`, never thrown into your graph:

```ts
// ❌ an effect inside a pure combinator
const results = queries.map((q) => fetch(`/api?q=${q}`)); // Stream<Promise> — now what?

// ✅ IO at the boundary, results as data
const results = perform(queries, (q) =>
  fetch(`/api?q=${q}`).then((r) => r.json()),
);
// results: Stream<Result<Data, unknown>> — pattern-match, don't try/catch
```

The full story, including cancellation and request numbering:
[Async](/guides/async).

---

**A meta-rule that covers half of this page:** a component runs **once**.
Anything you compute with plain JavaScript in the component body is computed
once and frozen. Anything that should _live_ must be a Wire, a Stream, or
a derivation of them — and the moment you find yourself reaching _out_ of a
pure combinator (to the DOM, to the network, to another event), move that
code to the boundary: a handler, `perform`, or `onMount`/`onCleanup`.
