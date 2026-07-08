# From React to Continuum

The same code side by side: idiomatic React (19, function components + hooks)
on the left, Continuum on the right. The goal is not "React is bad" — it is
to show where every familiar construct goes, and why many of them simply
don't exist here.

There is one central mental-model shift:

> **React**: a component is a render function. It re-runs on every change,
> and hooks smuggle state between the re-runs.
>
> **Continuum**: a component runs **once**. Reactive quantities are objects
> (`Behavior`) placed directly into JSX; from then on only the affected text
> nodes and attributes change.

The consequences follow: no re-renders → no deps arrays, no `memo`, no
`useCallback`, no stale closures, no rules of hooks.

## Why switch, honestly

If all you want is "React but faster", Solid already does that — and
switching frameworks for a benchmark is rarely worth it. Continuum earns the
switch with the part the others don't have: **change is data**. Every user
action is an occurrence in a stream; state is a fold over that stream. That
one idea turns whole libraries into one-liners — undo/redo is a second fold
over the same actions, persistence is a mirror of the folded value,
cross-tab sync is one more dispatcher into the same reducer, and search
never races because "last request wins" is solved in the library. The
[patterns cookbook](/guides/patterns) shows each of these in a few lines.
If your app is a form over an API, stay put. If its state has a _story_ —
this is the framework that treats the story as a first-class value.

## Correspondence table

| React                        | Continuum                              | Comment                                                            |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `useState(init)`             | `newBehavior(init)`                    | returns `[Behavior, set]`; can be declared outside a component too |
| `useMemo(f, [a, b])`         | `a.map(f)` / `Behavior.lift2(f, a, b)` | dependencies are the expression's structure; no array needed       |
| `useEffect(f, [x])`          | `x.listen(f)` + `onCleanup`            | subscribe to a value; cleanup is explicit and one-time             |
| `useEffect(f, [])` (mount)   | `onMount(f)`                           | runs once, when the nodes are already inserted into the DOM        |
| `useEffect(fetch…)`          | `perform` / `resource`                 | IO is a network boundary; errors are data (`Result`), not throws   |
| `useContext` / `<Provider>`  | `use(ctx)` / `provide(ctx, v)`         | the same, but over the ownership tree                              |
| `useRef(dom)`                | a plain variable, or `ref={…}`         | the component runs once — `const el = <div/>` is already stable    |
| `useCallback` / `memo`       | —                                      | not needed: nothing re-runs, identity is stable                    |
| `key` in lists               | `by` in `<Each>`                       | same meaning (keyed reconciliation; we diff with LIS)              |
| `{cond && <A/>}`             | `<Show when={b}>`                      | rebuilds only when truthiness flips                                |
| `<Suspense>` + `React.lazy`  | `lazy(() => import(…), { fallback })`  | pending/error are ordinary values, not an exception mechanism      |
| Error Boundary (class / lib) | `<Catch fallback={(e, reset) => …}>`   | a component, not a class; catches build and region-rebuild throws  |
| `useSyncExternalStore`       | `Behavior.fromPoll` / `newBehavior`    | the outside world enters as a behavior                             |
| `onClick={handler}`          | `onClick={fire}`                       | the event flows into the FRP network, not into setState            |
| StrictMode double-render     | —                                      | nothing re-runs — nothing to double-check                          |

---

## 1. Counter

**React**

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>;
}
```

**Continuum**

```tsx
import { newBehavior } from "@continuum-js/frp";

function Counter() {
  const [count, setCount] = newBehavior(0);
  return (
    <button onClick={() => setCount(count.sample() + 1)}>count: {count}</button>
  );
}
```

Nearly identical — but the semantics differ: React re-runs `Counter` on
every click and re-renders the subtree; Continuum runs `Counter` once, and a
click patches exactly one text node — the one bound to `count`. If you like
streams, the same counter can be an event fold:
`clicks.accum(0, (_e, n) => n + 1)` — "count is a fold of clicks".

## 2. Derived state

**React** — memoization with hand-listed dependencies:

```tsx
function Cart({ items }: { items: Item[] }) {
  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items], // forget an entry — enjoy your stale-value bug
  );
  const label = useMemo(() => `${total.toFixed(2)} ₸`, [total]);
  return <b>{label}</b>;
}
```

**Continuum** — the dependency _is_ the expression:

```tsx
function Cart(props: { items: Behavior<Item[]> }) {
  const total = props.items.map((xs) =>
    xs.reduce((s, i) => s + i.price * i.qty, 0),
  );
  const label = total.map((t) => `${t.toFixed(2)} ₸`);
  return <b>{label}</b>;
}
```

Dependency arrays don't exist as a category: `label` depends on `total`
because it is _built from it_. Forgetting a dependency is syntactically
impossible. Multiple sources — `Behavior.lift2((a, b) => …, ba, bb)`.

## 3. An effect and its cleanup

**React**

```tsx
function Online() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []); // the empty array means "mount only" — you have to KNOW that
  return <span>{online ? "online" : "offline"}</span>;
}
```

**Continuum**

```tsx
import { newBehavior } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";

function Online() {
  const [online, setOnline] = newBehavior(navigator.onLine);
  const on = () => setOnline(true);
  const off = () => setOnline(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  onCleanup(() => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  });
  return <span>{online.map((o) => (o ? "online" : "offline"))}</span>;
}
```

The component body is plain code that runs once, so a "mount effect" is just
code in the body, and `onCleanup` registers the teardown in the ownership
tree: unmounting the subtree runs it in a cascade.

One nuance: the body runs _before_ the nodes are inserted into the document.
If an effect needs a live element — focus, measurements, initializing a
third-party library — there is `onMount`: the callback runs right after the
subtree is inserted (on first mount, on a `dyn`/`Show` switch, on a new
`Each` row). Child scopes mount before their parents, as in React.

```tsx
import { onMount, onCleanup } from "@continuum-js/dom";

function SearchBox() {
  const input = (<input placeholder="search…" />) as HTMLInputElement;
  onMount(() => input.focus()); // the element is already in the document
  return input;
}
```

If the element is declared deep inside JSX and pulling it into a variable is
awkward, the familiar `ref` works — as a function (`ref={(el) => …}`) or as
an object (`ref={obj}` writes the element into `obj.current`). It fires at
element creation, so combine it with `onMount` for focus/measurements.

Unlike React hooks, `onMount`/`onCleanup` are ordinary functions: call them
in conditions, in loops, extract them into helpers — no rules of hooks.

## 4. Data fetching

**React** — by hand (simplified; in practice you reach for TanStack Query
precisely because doing this by hand hurts):

```tsx
function User({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // response-race protection — manual
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p>loading…</p>;
  if (error) return <p>error</p>;
  return <p>{user!.name}</p>;
}
```

**Continuum** — `resource` from std: a state machine
`idle → loading → ok | error`, with the response race solved inside
(last-request-wins):

```tsx
import { type Behavior } from "@continuum-js/frp";
import { Dynamic } from "@continuum-js/dom";
import { resource } from "@continuum-js/std";

function User(props: { id: Behavior<string> }) {
  const state = resource(props.id.updates, (id) =>
    fetch(`/api/users/${id}`).then((r) => r.json() as Promise<User>),
  );
  return (
    <Dynamic value={state}>
      {(s) =>
        s.status === "loading" ? (
          <p>loading…</p>
        ) : s.status === "error" ? (
          <p>error</p>
        ) : s.status === "ok" ? (
          <p>{s.value.name}</p>
        ) : (
          <p>—</p>
        )
      }
    </Dynamic>
  );
}
```

Three `useState` flags (the "dirty state" of FRP-MODEL.md §1) collapse into
one state-machine value. An error is not an exception — it is a data branch.

## 5. A keyed list

**React**

```tsx
<ul>
  {todos.map((t) => (
    <li key={t.id}>{t.text}</li>
  ))}
</ul>
```

**Continuum**

```tsx
<ul>
  <Each each={todos} by={(t) => t.id}>
    {(t) => <li>{t.text}</li>}
  </Each>
</ul>
```

`by` is the same `key`. The difference is under the hood: React re-renders
the parent and diffs VDOM; `<Each>` keeps one live subtree per key and
reorders the DOM with minimal moves (LIS), preserving focus.

## 6. Conditional rendering

**React**

```tsx
{
  user ? <Profile user={user} /> : <Guest />;
}
```

**Continuum**

```tsx
<Show when={user} fallback={() => <Guest />}>
  {(u) => <Profile user={u} />}
</Show>
```

`<Show>` rebuilds the subtree only when the _truthiness_ of `when` changes,
not on every value update. (There is also a functional form `when(b, then,
else)` for JSX-free code.)

## 7. Controlled input

**React**

```tsx
const [text, setText] = useState("");
<input value={text} onChange={(e) => setText(e.target.value)} />;
```

**Continuum**

```tsx
const [text, setText] = newBehavior("");
<input {...bindInput(text, setText)} />;
```

The same, minus a component re-run per keystroke.

::: warning onChange is not React's onChange
Continuum attaches **native** DOM listeners, and the native `change` event on
a text input fires only when the field loses focus. To react to every
keystroke, use `onInput` (that is what `bindInput` does):

```tsx
<input value={text} onInput={(e) => setText(e.currentTarget.value)} />
```

Stream props are fully typed — the editor autocompletes them and knows the
event type — and both casings work: `onKeyDown` and `onKeydown` attach the
same listener. Streams are **native**, not synthetic: inline handlers get
`e.currentTarget` already typed to the tag (no cast, as above). When you
**extract** a handler, annotate the parameter exactly like in React — the
aliases ship in the package:

```tsx
import type { SubmitEvent, MouseEvent } from "@continuum-js/dom";

const onSubmit = (e: SubmitEvent) => e.currentTarget.elements; // HTMLFormElement by default
const onClick = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.type;
```

Prefer not to shadow the DOM globals? The same aliases come as a namespace:
`import type { Streams } from "@continuum-js/dom"` →
`(e: Streams.MouseEvent<HTMLButtonElement>) => …`.

For wrapping components there is `ComponentProps<"button">` — see the
[polymorphic button recipe](/guides/patterns#22-a-shareable-polymorphic-button-componentprops).
:::

## 8. Context

**React**

```tsx
const Theme = createContext("light");

function App() {
  return (
    <Theme.Provider value="dark">
      <Toolbar />
    </Theme.Provider>
  );
}
function Toolbar() {
  const theme = useContext(Theme);
  return <div className={theme}>…</div>;
}
```

**Continuum**

```tsx
const Theme = createContext("light");

function App() {
  provide(Theme, "dark"); // writes into the current owner
  return <Toolbar />;
}
function Toolbar() {
  const theme = use(Theme); // looks up the ownership tree
  return <div class={theme}>…</div>;
}
```

The provider is not a wrapper component but a write into the ownership tree.
Want a reactive theme? Put a `Behavior<string>` into the context and use it
in an attribute as usual.

## 9. Debounced search

**React** — a custom hook (and its upkeep):

```tsx
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
const debouncedQuery = useDebounced(query, 300);
```

**Continuum** — a combinator over an event:

```tsx
import { debounce } from "@continuum-js/std";

const settled = debounce(query.updates, 300); // Stream<string>
const results = resource(settled, search);
```

## 10. A lazy page + the router

**React** (react-router + Suspense)

```tsx
const About = React.lazy(() => import("./About"));

<Routes>
  <Route path="/" element={<Home />} />
  <Route
    path="/about"
    element={
      <Suspense fallback={<p>loading…</p>}>
        <About />
      </Suspense>
    }
  />
</Routes>;
```

**Continuum**

```tsx
import { Router, lazy, type RouteDef } from "@continuum-js/router";

const About = lazy(() => import("./About.js"), {
  fallback: () => <p>loading…</p>,
});

const routes: RouteDef[] = [
  { path: "", component: Home },
  { path: "about", component: About },
];

<Router routes={routes} />;
```

The chunk splitting is identical (the literal `import()` is what the bundler
cuts on), but the pending state is not "a suspended render caught by
Suspense" — it is an ordinary value. A Continuum-router bonus:
`/users/1 → /users/2` does not rebuild the page — only the `useParams()`
behavior updates.

---

## What Continuum doesn't have — and why

- **Re-renders.** A component is a subtree constructor, not a render
  function. An update is a value propagating through the graph to a specific
  text node.
- **Deps arrays.** An expression's dependencies are the expression itself
  (`map`/`lift`). The "forgot a dependency" / "extra dependency" bug class
  does not exist.
- **`memo` / `useCallback` / identity stabilization.** Nothing re-runs;
  value and function identity is stable by construction.
- **Stale closures.** A closure captures the `Behavior` — the quantity
  itself, not its snapshot; `b.sample()` always reads the current value.
- **Rules of hooks.** `newBehavior`/`listen` are ordinary functions: in a
  condition, in a loop, outside a component, at module level.
- **Suspense as a mechanism.** Async is data (`Async<T>`, `Result<E, T>`),
  rendered with a plain `<Show>`/`<Dynamic>`.
- **Batching as an optimization.** The core's transactions are not "gluing
  updates for speed" — they are a model of simultaneity: same-moment changes
  are atomic by construction (see
  [FRP-MODEL.md](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md)).

## The honest downsides

- **An unfamiliar model.** Thinking in values-across-time and streams of
  occurrences is a skill; the entry bar is higher than "just write
  functions". Read first:
  [PHILOSOPHY.md](https://github.com/denislibs/continuum/blob/main/PHILOSOPHY.md),
  then
  [FRP-MODEL.md](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).
- **The `hold` delay.** Within one moment, reads see the value _before_ it —
  that's a feature (recursive state couldn't be defined otherwise), but it
  surprises you the first couple of times.
- **The ecosystem.** React has a universe of libraries; we have
  frp/dom/std/router/test and a roadmap.

Live code for all the examples is in
[`examples/`](https://github.com/denislibs/continuum/tree/main/examples):
counter, todo, debounced search, animation, router.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
