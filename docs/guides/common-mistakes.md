# Common mistakes

::: tip In plain words
The eight ways a Continuum app most often "doesn't work" — what the symptom
looks like, why it happens, and the one-line fix. Bookmark this page for your
first week.
:::

## 1. Side effects inside `map` / `accum`

**Symptom:** works sometimes, breaks after refactoring; values are `null`
when you least expect it.

The functions you pass to `map`, `accum`, `filter`, `snapshot` must be
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
const [texts, fireText] = newEvent<string>();
const todos = texts.accum<Todo[]>([], (text, acc) => [
  ...acc,
  createTodo(text),
]);

const onSubmit = (e: SubmitEvent) => {
  e.preventDefault();
  const input = (e.currentTarget as HTMLFormElement).elements.namedItem("todo");
  if (input instanceof HTMLInputElement && input.value.trim()) {
    fireText(input.value.trim());
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
<form onSubmit={fireSubmit}>

// ✅
<form onSubmit={(e) => { e.preventDefault(); fireSubmit(e); }}>
```

This is browser behavior, not Continuum's — but "my todo doesn't get added"
is how it always looks.

## 3. `.sample()` in JSX

**Symptom:** the value renders once and never updates.

`sample()` reads the current value **right now** and returns a plain,
non-reactive result. A component runs once, so a sampled value is frozen
forever. Put the Behavior itself into JSX — that's the whole point:

```tsx
// ❌ renders the initial value, then never changes
<div>{count.sample()}</div>

// ✅ a live binding: this text node updates on every change
<div>{count}</div>
```

`sample()` belongs in **handlers**, where you need "the value at the moment
of the click":

```tsx
<button onClick={() => setCount(count.sample() + 1)}>+1</button>
```

## 4. A ternary instead of `<Show>`

**Symptom:** the condition is evaluated once and the branch never switches
(or the code doesn't typecheck at all).

A component runs once, so a plain `if`/ternary chooses a branch **once**.
Reactive branching is what `<Show>` (or `when`/`dyn`) is for:

```tsx
// ❌ `list` is a Behavior — there is no `.length` on it,
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
<input value={text} onChange={(e) => setText((e.target as HTMLInputElement).value)} />

// ✅ fires per keystroke — or just use bindInput
<input value={text} onInput={(e) => setText((e.target as HTMLInputElement).value)} />
<input {...bindInput(text, setText)} />
```

## 6. Expecting `snapshot` to see the new value in the same moment

**Symptom:** a snapshot taken "at the same time" as an update reads the
_previous_ value, and it looks like an off-by-one bug.

It isn't a bug — it's the **hold delay**, the core rule of the model: within
one moment, every Behavior still holds the value it had _before_ the moment.
The new value becomes visible after the moment closes. This is exactly what
makes state loops (`accum`, feedback through `hold`) well-defined instead of
infinite.

```ts
const held = src.hold(0);
const pairs = src.snapshot(held, (now, prev) => [now, prev]);
fire(1); // pairs sees [1, 0] — `prev` is the value BEFORE this moment
fire(2); // pairs sees [2, 1]
```

If you need "the value including this update", derive it (`map`, `accum`)
instead of snapshotting it. The long version: [Transactions and
time](/concepts/transactions).

## 7. A module-level derived value dies with its last subscriber

**Symptom:** `Error: … disposed after its last listener unsubscribed`.

Derived values (`map`, `hold`, …) clean themselves up when the last listener
unsubscribes — that's what keeps long-running apps leak-free. A derivation
created at **module level** and shared across components gets disposed when
the last component using it unmounts; the next mount then reuses a dead node
and throws.

```ts
// ❌ module level: dies when the last subscriber unmounts
export const theme = settings.map((s) => s.theme);

// ✅ opt out explicitly for intentionally long-lived derivations
export const theme = settings.map((s) => s.theme).retain();
```

Inside components you never think about this: the ownership tree subscribes
and unsubscribes for you. Sources (`newBehavior`, `newEvent`) are pinned
automatically.

## 8. `fetch` inside `map`

**Symptom:** duplicated requests, unhandled rejections, race conditions on
fast typing.

`map` is for pure transformations. IO has a dedicated boundary: `perform`
(or `resource` from `@continuum-js/std`), which runs the effect **after** the
moment closes and returns the result as data — errors included, wrapped in
`Result`, never thrown into your graph:

```ts
// ❌ an effect inside a pure combinator
const results = queries.map((q) => fetch(`/api?q=${q}`)); // Event<Promise> — now what?

// ✅ IO at the boundary, results as data
const results = perform(queries, (q) =>
  fetch(`/api?q=${q}`).then((r) => r.json()),
);
// results: Event<Result<Data, unknown>> — pattern-match, don't try/catch
```

The full story, including cancellation and request numbering:
[Async](/guides/async).

---

**A meta-rule that covers half of this page:** a component runs **once**.
Anything you compute with plain JavaScript in the component body is computed
once and frozen. Anything that should _live_ must be a Behavior, an Event, or
a derivation of them — and the moment you find yourself reaching _out_ of a
pure combinator (to the DOM, to the network, to another event), move that
code to the boundary: a handler, `perform`, or `onMount`/`onCleanup`.
