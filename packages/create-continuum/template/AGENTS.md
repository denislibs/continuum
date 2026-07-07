# Continuum — rules for AI assistants

This project uses **Continuum** (`@continuum-js/*`) — a reactive UI
framework that is NOT React. Read these rules before writing code.
Full docs for machines: https://denislibs.github.io/continuum/llms.txt
(or llms-full.txt for everything in one file).

## The model in three lines

1. A component is a plain function that runs **exactly once**. There are no
   re-renders, no hooks, no dependency arrays, no virtual DOM.
2. State is a `Behavior` (a reactive value). Put it directly into JSX —
   `{count}`, `class={cls}` — and that binding updates by itself.
3. Derived state is `b.map(fn)` / `Behavior.lift2(fn, a, b)` — never stored
   and synced by hand.

## Never write these (React habits)

- `useState` / `useEffect` / `useMemo` / `useCallback` / `useRef` — do not
  exist. State: `newBehavior`. Mount effects: `onMount`. Teardown:
  `onCleanup`. Derived: `.map`.
- Re-calling a component to "update" it — components never re-run.
- `{cond && <A/>}` with a Behavior — use `<Show when={b}>`.
- `array.map` in JSX for a **changing** list — use `<Each each={b} by={key}>`
  (plain `array.map` is fine for static data).
- Auto-tracking assumptions (Solid/Vue habits): dependencies are NOT
  detected by reading values inside a closure. `map`/`lift2` declare them
  explicitly.

## Verify your changes

Run `npm run lint` after editing — ESLint ships preconfigured with
`@continuum-js/eslint-plugin`, which catches Continuum-specific mistakes
(side effects inside `accum`/`snapshot` callbacks, `sample()` rendered into
JSX, missing `.retain()`, `onChange` on text fields). Format with
`npm run format` (prettier). Tests: `npm test`.

## Exact signatures (do not guess)

```ts
// @continuum-js/frp
const [b, set] = newBehavior<T>(init);      // Behavior<T> + setter
const [e, fire] = newEvent<T>();            // Event<T> + injector
b.map(f); b.sample(); b.updates;            // updates: Event<T> of changes
Behavior.lift2(f, a, b); Behavior.lift3(f, a, b, c);
e.map(f); e.filter(p); e.mapTo(v); e.once(); e.gate(boolB);
e.hold(init);                               // Event -> Behavior (last value)
e.accum(init, (a, acc) => next);            // Event -> Behavior (fold)
e.snapshot(b, (a, bv) => c);                // read a Behavior at the event's moment
Event.merge(ea, eb, (l, r) => combined);    // TWO events + combiner. NOT an array.
perform(e, async (a) => b);                 // -> Event<Result<unknown, B>>
// Result = { ok: true, value } | { ok: false, error }

// @continuum-js/dom
mount(container, () => <App />);            // returns unmount()
onMount(fn); onCleanup(fn);                 // register in component body only
<Show when={b} fallback={() => <X/>}>{(v) => <Y/>}</Show>
<Each each={listB} by={(item) => item.id}>{(item) => <Row/>}</Each>
<Dynamic value={b}>{(v) => …}</Dynamic>     // prop is `value`, not `of`
<input {...bindInput(textB, setText)} />
<Catch fallback={(err, reset) => …}>{() => <Risky/>}</Catch> // children MUST be a thunk
createContext(def); provide(ctx, v); use(ctx);

// @continuum-js/std
debounce(e, ms); throttle(e, ms); interval(ms); distinctB(b);
resource(triggerEvent, async (arg) => data); // -> Behavior<Async<T>>
// Async<T> discriminant is `status`: "idle" | "loading" | "ok" | "error"
// s.status === "ok" -> s.value; s.status === "error" -> s.error

// @continuum-js/router
<Router routes={routes} fallback={() => <NotFound/>} />
// RouteDef: { path, component?, children?, guard?: (params) => true | "/redirect" }
<Outlet />; <Link href="/x">…</Link>; useParams(); // Behavior<Params>
navigate("/x"); navigate("/x", { replace: true }); location(); // Behavior<URL>
lazy(() => import("./Page.js"), { fallback: () => <p>…</p> });
```

## Rules that prevent real bugs

- `e.listen(handler)` returns an unsubscribe and is NOT tied to the
  component automatically. Always: `onCleanup(e.listen(handler))`.
- A derivation (`map`/`hold`/…) shared at MODULE level across mounts must be
  marked `.retain()` — otherwise it auto-disposes when its last listener
  leaves, and re-use throws. Derivations inside components need nothing.
- `interval`/`delay` timers stop on `dispose()`:
  `onCleanup(() => ticks.dispose())`.
- Reading state: in plain DOM handlers `b.sample()` is fine
  (`onClick={() => set(count.sample() + 1)}`). Inside event-stream logic
  use `e.snapshot(b, …)`, not `sample` — snapshot has exact semantics for
  simultaneous events.
- A Behavior updates at the end of its transaction: inside the very event
  that changes it, `hold`/`accum` still show the previous value. This is by
  design (see docs: Transactions and time).
- DOM access (focus, measure, third-party widgets) goes in
  `onMount(() => …)` — the component body runs before nodes are in the
  document.
- Elements are real DOM values: `const el = (<input/>) as HTMLInputElement`
  is idiomatic; `ref={fn}` also works.

## Package map

| Import from            | What lives there                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `@continuum-js/frp`    | newBehavior, newEvent, Behavior, Event, perform, constant, integral/warp                    |
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
