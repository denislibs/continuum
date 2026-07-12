# Continuum

**English** | [Русский](README.ru.md) | [Українська](README.uk.md)

[![CI](https://github.com/denislibs/continuum/actions/workflows/ci.yml/badge.svg)](https://github.com/denislibs/continuum/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40continuum-js%2Fdom?label=npm%20%40continuum-js%2Fdom)](https://www.npmjs.com/package/@continuum-js/dom)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40continuum-js%2Fdom?label=dom%20minzip)](https://bundlephobia.com/package/@continuum-js/dom)
[![docs](https://img.shields.io/badge/docs-denislibs.github.io-blue)](https://denislibs.github.io/continuum/)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A reactive UI framework built on **classic FRP** (States + Streams) with
fine-grained rendering. The discrete branch of Elliott's tradition, Sodium
style: transactions, rank-ordered propagation, the `hold` delay at the moment
boundary.

The key decision: a `State` is a **value**, not a read function. A reactive
quantity is passed around as an object (`<div>{count}</div>`), so the renderer
needs no build-time transform.

**Featherweight, measured honestly:** a complete app — framework, state
management, renderer _and_ the app code — builds to **5.6 kB of gzipped JS**
(the whole `examples/counter` bundle). React + ReactDOM alone weigh ~8× that,
before you add a state library.

> 📖 A conceptual walkthrough of the model — from philosophy to algebra to its
> consequences — in [PHILOSOPHY.md](PHILOSOPHY.md) (Russian).
>
> ⚙️ The operational side of the same model — transactions, the `hold` delay,
> ranks, `switch`, with references to Blackheath & Jones, «Functional Reactive
> Programming» (Manning) — in [FRP-MODEL.md](FRP-MODEL.md) (Russian).
>
> ⚛️ Side-by-side React → Continuum code comparisons — in [FROM-REACT.md](FROM-REACT.md) (Russian).
>
> 🗺️ The milestone roadmap (publishing → router → docs → hardening →
> ecosystem) — in [ROADMAP.md](ROADMAP.md) (Russian).

## Monorepo

```
continuum/
├─ packages/
│  ├─ frp/        @continuum-js/frp   — core: Stream, State, scheduler
│  ├─ dom/        @continuum-js/dom   — renderer: h, dyn, each, ownership, context
│  ├─ std/        @continuum-js/std   — combinators: resource, debounce, throttle, …
│  ├─ router/     @continuum-js/router — the URL as a State: nested routes, lazy pages
│  └─ test/       @continuum-js/test  — test utilities: render, fire, flush
├─ examples/                       — runnable examples (Vite), one folder each
│  ├─ counter/    @continuum-js/example-counter    — the §1.1 counter + test
│  ├─ todo/       @continuum-js/example-todo        — <Show>/<Each> + bindInput + test
│  ├─ animation/  @continuum-js/example-animation   — integral + time warp (continuous time)
│  ├─ showcase/   @continuum-js/example-showcase    — <Dynamic> (tabs) + <Show>/<Portal> (modal)
│  └─ data/       @continuum-js/example-data        — HTTP: perform/Result + debounce + resource
│  └─ router-app/ @continuum-js/example-router-app — nested layout, lazy chunk, guards, 404
├─ benchmark/     @continuum-js/benchmark           — js-framework-benchmark table + Playwright timing
├─ .size-limit.json   — bundle size budgets (npm run size)
├─ vitest.config.ts   — shared runner (jsdom, automatic JSX), source aliases
├─ tsconfig.json      — solution-style, project references
└─ tsconfig.base.json — shared compilerOptions
```

Dependencies are strictly one-way: `dom` → `frp`, `std` → `frp`; `frp` is
self-contained. Examples live in the root `examples/` and consume the packages
as `@continuum-js/frp` / `@continuum-js/dom` / `@continuum-js/std`.

## Quick start

A new project (Vite + TypeScript + a counter + a test):

```bash
npm create continuum-js@latest my-app
cd my-app && npm install && npm run dev
```

Working on the framework itself:

```bash
npm install
npm test              # vitest run
npm run typecheck     # tsc -b across all packages
npm run example:counter  # Vite dev server for examples/counter
npm run example:todo     # Vite dev server for examples/todo
npm run example:showcase # <Dynamic>/<Show>/<Portal> demo
npm run example:data     # live search: fetch via perform/Result + debounce
npm run example:router   # router: nested layout, lazy chunk, guard, 404
npm run size             # size-limit: gzip/brotli size of the packages
npm run bench            # Playwright timing of the js-framework-benchmark table
npm run build            # build dist/ (ESM + .d.ts) for all published packages
npm run smoke            # publish contract: pack → npm i into a clean Vite app → tsc + vite build
```

### How it compares

Solid-class speed and memory, in a fraction of the bytes. All measured on one
machine through the same Playwright harness (`npm run bench`, `bench:mem`,
`size`); Solid runs its own compiler, Continuum runs `@continuum-js/vite-plugin`.

| gzipped, full counter app | Continuum  | Solid | React + ReactDOM |
| ------------------------- | ---------- | ----- | ---------------- |
| download                  | **5.6 kB** | ~7 kB | ~45 kB (~8×)     |

| js-framework-benchmark, 10k rows | Continuum  | Solid   |
| -------------------------------- | ---------- | ------- |
| heap after GC                    | **9.7 MB** | 14.1 MB |
| GC garbage on create             | **8.4 MB** | 13.8 MB |
| select row (script ms)           | **0.10**   | 0.20    |
| swap / remove / clear            | ~parity    | ~parity |
| create 10k rows (script ms)      | 32.9       | 27.8    |

**−32 % heap, ~40 % less garbage, faster interaction**, ~1.2× on bulk create,
one-third the download. Package brotli sizes (with deps): `frp` **4.1 kB**,
`dom` (incl. frp) **6.3 kB**, `std` **3.3 kB** — budgets in
[`.size-limit.json`](.size-limit.json), `npm run size` fails when exceeded.
React is a virtual-DOM re-render model: several times slower on the same table
(see [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/)).

### A counter in 10 lines (`examples/counter`)

```tsx
import { stream, state } from "@continuum-js/frp";

export function Counter() {
  const clicks = stream<MouseEvent>();
  const count = state(0).on(clicks, (n) => n + 1);
  return <button onClick={clicks.fire}>count: {count}</button>;
}
```

A component runs **once**. The click flows into the FRP network, the `.on`
transition folds it into the state, and exactly one text node is patched — no
virtual DOM, no diffing.

> JSX works through the **automatic runtime** — components don't need
> `import { h }`. Setup: `"jsx": "react-jsx"`,
> `"jsxImportSource": "@continuum-js/dom"` (for Vite/esbuild —
> `jsx: "automatic"`). `h` remains exported for explicit calls.

## What's implemented

**Core (`@continuum-js/frp`).** Transactions (prioritized/last/post phases), a
rank min-heap with glitch-free propagation, coalescing of simultaneous
occurrences, the `hold` delay. Combinators: `map`, `mapTo`, `filter`, `when`,
`merge`, `or`, `accum`/`accumE`, `hold`, `once`, `listen`; for states — `map`,
`at` (sample a state at a stream's occurrences), `combine` (pointwise join),
`flatten` (state-of-states / state-of-streams switch), `fromPoll`, `time`,
`listen`; sources — `state(init)` with `.set`/`.on` and `stream()` with
`.fire`. From the roadmap: `distinct`, `perform` (the IO boundary
with `Result`), error isolation in the post phase and "atomic or dropped
moment" via transaction-identity staging; **rank maintenance**
(`ensureBiggerThan` + cycle detection) for correct `switch` in dense graphs;
**continuous time** — `integral`/`derivative`/`warp` (numerically sampled over
a discrete clock); **explicit `dispose`** on `Stream`/`State` with an upward
cascade through unused derived nodes (for long-lived non-UI graphs).

**Renderer (`@continuum-js/dom`).** JSX factory `h`/`Fragment`, fine-grained
bindings for text/attributes/properties, `on*` events, `dyn`, `each` (keyed
reconciliation with LIS diffing and focus preservation), the ownership tree
`root`/`scope`/`onCleanup` with cascading subscription cleanup, context
`createContext`/`provide`/`use`, helpers `when`/`bindInput`/`portal`, wrapper
components `<Show>`/`<Each>`/`<Dynamic>`/`<Portal>`, `animationFrames` (a
frame clock for continuous time), SVG namespaces (`<svg>` subtrees via
`createElementNS`), `mount`.

## Continuous time

`integral`/`derivative`/`warp` from the core work over a discrete clock (a
`Stream<number>` of timestamps) — in the browser that's `animationFrames()`.
The implementation is numerical (forward Euler / finite differences),
deterministic, and independent of the observer count: accumulation happens
once per tick. The denotation is resolution-independent; the sampled result
approximates it. Demo — [`examples/animation`](examples/animation)
(`npm run example:animation`).

## Working with data (HTTP)

IO lives at the **boundary** of the network. `perform` takes a `Stream` of
requests, runs the async effect in the post phase (after the moment closes)
and returns the result as a new occurrence — as data, with the error wrapped
in a `Result` rather than thrown. On top of it,
[`@continuum-js/std`](packages/std) provides ready-made building blocks (and
[`examples/data`](examples/data) shows them in action):

- `resource(trigger, fetcher): State<Async<T>>` — a state machine
  (`idle → loading → ok | error`). Requests are numbered, so a late response
  to a superseded request is dropped (last-request-wins) — the classic
  response-race bug solved declaratively.
- `debounce(event, ms)` — coalesce a burst into its last value after a pause.

Together they make search-as-you-type: `input → debounce → fetch →
loading/error/empty/results`. The fetcher is injected, so the component is
testable without a network (`npm run example:data` hits the real GitHub API).

## Limitations (see roadmap §14 of the spec)

- **Continuous time** is implemented _numerically_ by sampling over a clock,
  not as a first-class `Time = ℝ` in the pure-Elliott sense: precision depends
  on the clock rate, and `warp` remaps tick timestamps (see
  [PHILOSOPHY.md](PHILOSOPHY.md)).
- **Reference-based memory model**, no weak references: subscription runs from
  source to consumer, so derived nodes stay alive as long as their source
  does. Explicit `dispose()` (with an upward cascade through unused derived
  nodes) breaks the chain manually; in UI code the `dom` layer's ownership
  tree does this for you.
