# Continuum — rules for AI assistants

This project uses **Continuum** (`@continuum-js/*`) — a reactive UI
framework that is NOT React. Read these rules before writing code.
Full docs for machines: https://denislibs.github.io/continuum/llms.txt
(or llms-full.txt for everything in one file).

## The model in three lines

1. A component is a plain function that runs **exactly once**. There are no
   re-renders, no hooks, no dependency arrays, no virtual DOM.
2. State is a `Wire` (a reactive value). Put it directly into JSX —
   `{count}`, `class={cls}` — and that binding updates by itself.
3. Derived state is `w.map(fn)` / `combine(a, b, fn)` — never stored
   and synced by hand.

## Never write these (React habits)

- `useState` / `useEffect` / `useMemo` / `useCallback` / `useRef` — do not
  exist. State: `wire`. Mount effects: `onMount`. Teardown:
  `onCleanup`. Derived: `.map`.
- Re-calling a component to "update" it — components never re-run.
- `{cond && <A/>}` with a Wire — use `<Show when={b}>`.
- `array.map` in JSX for a **changing** list — use `<Each each={b} by={key}>`
  (plain `array.map` is fine for static data).
- Auto-tracking assumptions (Solid/Vue habits): dependencies are NOT
  detected by reading values inside a closure. `map`/`combine` declare them
  explicitly.

## Verify your changes

Run `npm run lint` after editing — ESLint ships preconfigured with
`@continuum-js/eslint-plugin`, which catches Continuum-specific mistakes
(side effects inside `accum`/`at` callbacks, `sample()` rendered into
JSX, module-level state without `root()`, `onChange` on text fields).
Format with `npm run format` (prettier). Tests: `npm test`.

## Exact signatures (do not guess)

```ts
// @continuum-js/frp
const w = wire<T>(init);                    // WireSource<T>: read like any Wire, write via w.set(v)
w.set(v);                                    // set of an equal value is a no-op; custom eq as 2nd arg of wire()
const e = stream<T>();                       // StreamSource<T>: occurrences enter via e.fire(v)
const count = wire(0)                        // declarative state transitions:
  .on(inc, (n) => n + 1)                     //   (state, event) => next, useReducer order;
  .on(dec, (n) => n - 1);                    //   simultaneous sources fold sequentially
batch(() => { a.set(1); b.set(2); });        // several sets/fires as ONE moment
w.map(f); w.sample(); w.updates;            // updates: Stream<T> — ONE coalesced occurrence per moment
combine(a, b, (av, bv) => r);               // pointwise join; data first, combiner last (2–5 wires)
w.at(e);                                    // Stream of w's values at e's occurrences
w.at(e, (value, event) => c);               // …with a combiner — note the (value, event) order
e.map(f); e.filter(p); e.mapTo(v); e.once(); e.when(boolW);
ea.or(eb);                                  // left-biased merge of same-typed streams
e.hold(init);                               // Stream -> Wire (last value)
e.accum(init, (a, acc) => next);            // Stream -> Wire (fold)
Stream.merge(ea, eb, (l, r) => combined);    // TWO events + combiner. NOT an array.
flatten(wireOfWires); flatten(wireOfStreams); // follow the currently selected inner Wire/Stream
perform(e, async (a) => b);                 // -> Stream<Result<unknown, B>>
// Result = { ok: true, value } | { ok: false, error }
root(() => …);                              // explicit scope for module-level state (see rules below)

// @continuum-js/dom
mount(container, () => <App />);            // returns unmount()
onMount(fn); onCleanup(fn);                 // register in component body only
<Show when={b} fallback={() => <X/>}>{(v) => <Y/>}</Show>
<Each each={listB} by={(item) => item.id}>{(item) => <Row/>}</Each>
<Dynamic value={b}>{(v) => …}</Dynamic>     // prop is `value`, not `of`
<input {...bindInput(text, text.set)} />
<Catch fallback={(err, reset) => …}>{() => <Risky/>}</Catch> // children MUST be a thunk
createContext(def); provide(ctx, v); use(ctx);

// @continuum-js/std
debounce(e, ms); throttle(e, ms); interval(ms); distinctB(b);
resource(triggerEvent, async (arg) => data); // -> Wire<Async<T>>
// Async<T> discriminant is `status`: "idle" | "loading" | "ok" | "error"
// s.status === "ok" -> s.value; s.status === "error" -> s.error

// @continuum-js/router
<Router routes={routes} fallback={() => <NotFound/>} />
// RouteDef: { path, component?, children?, guard?: (params) => true | "/redirect" }
<Outlet />; <Link href="/x">…</Link>; useParams(); // Wire<Params>
navigate("/x"); navigate("/x", { replace: true }); location(); // Wire<URL>
lazy(() => import("./Page.js"), { fallback: () => <p>…</p> });
```

## Rules that prevent real bugs

- State and effects require a scope: `hold` / `accum` / `wire().on()` /
  `perform` / `resource` register their process with the ambient owner.
  Inside a component the scope exists automatically — do nothing. At
  MODULE level there is none and the call throws — wrap it explicitly:
  `export const count = root(() => clicks.accum(0, (_e, n) => n + 1));`.
- `retain()` is a pure performance hint (keeps a hot derivation attached
  across listener churn). It is never required for correctness.
- `e.listen(handler)` returns an unsubscribe and is NOT tied to the
  component automatically. Always: `onCleanup(e.listen(handler))`.
- `interval`/`delay` timers stop on `dispose()`:
  `onCleanup(() => ticks.dispose())`.
- Reading state: in plain DOM handlers `w.sample()` is fine
  (`onClick={() => count.update((n) => n + 1)}`). Inside event-stream
  logic use `w.at(e, …)`, not `sample` — `at` has exact semantics for
  simultaneous events.
- A wire updates at the end of its transaction: inside the very event
  that changes it, `hold`/`accum`/`at` still show the previous value. This
  is by design (see docs: Transactions and time).
- A cell delivers ONE coalesced `updates` occurrence per moment: several
  `set`s inside one `batch` reach the graph as a single update carrying
  the final value.
- DOM access (focus, measure, third-party widgets) goes in
  `onMount(() => …)` — the component body runs before nodes are in the
  document.
- Elements are real DOM values: `const el = (<input/>) as HTMLInputElement`
  is idiomatic; `ref={fn}` also works.

## Package map

| Import from            | What lives there                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `@continuum-js/frp`    | wire, stream, combine, flatten, batch, root, Wire, Stream, perform, constant, integral/warp |
| `@continuum-js/dom`    | mount, Show, Each, Dynamic, Portal, onMount, onCleanup, bindInput, context, animationFrames |
| `@continuum-js/std`    | debounce, throttle, interval, distinctB, resource, Async                                    |
| `@continuum-js/router` | Router, Outlet, Link, useParams, navigate, location, lazy                                   |
| `@continuum-js/test`   | render, fire, click, type, flush (vitest helpers)                                           |

JSX runtime is configured via `jsxImportSource: "@continuum-js/dom"` in
tsconfig — do not add React.

## Docs

- Human docs: https://denislibs.github.io/continuum/
- Coming from React (construct-by-construct): https://denislibs.github.io/continuum/from-react
- Everything as one text file: https://denislibs.github.io/continuum/llms-full.txt
