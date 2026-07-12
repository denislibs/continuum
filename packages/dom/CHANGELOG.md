# @continuum-js/dom

## 0.16.0

### Patch Changes

- Updated dependencies [8b043ed]
  - @continuum-js/frp@0.16.0

## 0.15.0

### Minor Changes

- 9124590: Большой рефакторинг: «значения — формулы; состояние и эффекты — скоупу»
  (REFACTOR-PLAN.md, все шесть фаз). **Ломающие изменения** — миграция ниже.

  **Wire вместо Behavior + декларартивный API** (старые имена — алиасы до 1.0):

  - `Behavior` → `Wire`; `newBehavior(init)` → `wire(init)` (ячейка с `.set`),
    `newStream()` → `stream()` (источник с `.fire`) — кортежи умирают;
  - `Behavior.lift2(f, a, b)` / `lift3` / `apply` → `combine(a, b, f)` —
    вариадик, данные вперёд;
  - `e.snapshot(b, f)` → `b.at(e, (value, event) => …)` — порядок аргументов
    колбэка меняется на (значение, событие);
  - `e.gate(b)` → `e.when(b)`; `ea.orElse(eb)` → `ea.or(eb)`;
    `switchB`/`switchE` → `flatten(w)`.

  **Состояние и эффекты принадлежат скоупу** (breaking):

  - В ядре появился `Scope` + `root()`/`getScope()`/`runInScope`; Owner в dom
    построен поверх него — внутри компонента всё работает как раньше.
  - `hold`/`accum`/`perform` требуют владельца: вне скоупа — обучающая
    ошибка. Модульное состояние объявляется явно:
    `export const count = root(() => clicks.accum(0, (_e, n) => n + 1));`
  - `wire(0).on(inc, (n) => n + 1).on(dec, (n) => n - 1)` — декларативные
    переходы состояния (редьюсер `(state, event)`); вхождение и обновление —
    один момент, несколько источников в одном моменте фолдятся
    последовательно.
  - **Удалены** dispose-каскад «убить производную при отписке последнего
    слушателя» (замороженные счётчики и «disposed»-ловушки невозможны:
    формулы спят и просыпаются, состояние живёт со скоупом) и жнец
    FinalizationRegistry. `retain()` — чисто перф-подсказка.
  - eslint-правило `require-retain` заменено на `state-needs-scope`.

  **Два закона движка** (FRP-MODEL §12) закреплены структурным фаззером
  (push≡pull, cold≡warm, abort=no-trace, сон=отцепка — на случайных графах):

  - merge/distinct/once/flatten стали формулами (подключение по спросу;
    память distinct — «на тёплый период», флаг once персистентен, flatten
    при пробуждении подключает текущий выбор);
  - внутренние кэши движка стейджируются и коммитятся на границе момента:
    брошенный момент бесследен (скип по равенству, кэши combine, память
    distinct/once);
  - ячейка доставляет ОДНО коалесцированное вхождение `updates` на момент;
    flatten эмитит пост-коммитное значение при одновременном
    переключении+обновлении — push и pull сходятся.

  **Фиксы**: утечка `when`/`Show` (distinctB держал подписку на behavior
  условия навсегда), `style={w}` теперь чистит исчезнувшие ключи,
  `sample()` без открытия транзакции (~8× дешевле).

### Patch Changes

- Updated dependencies [9124590]
  - @continuum-js/frp@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [56a078e]
  - @continuum-js/frp@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [944371c]
  - @continuum-js/frp@0.13.0

## 0.12.1

### Patch Changes

- 36b268e: `onMount` callbacks now run UNDER their owner: `onCleanup` (and
  `provide`/`use`) inside an `onMount` callback attaches to the mounting
  scope — the composable anatomy the docs teach. Previously regions inserted
  by `dyn`/`each`/`Show` flushed their mount hooks ownerless, so the
  lifecycle guard threw ("onCleanup() was called outside a component/scope");
  before the guard existed, those cleanups were silently dropped — a leak.
  Found in the wild by the spreadsheet showcase's CI.
  - @continuum-js/frp@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [7952800]
  - @continuum-js/frp@0.12.0

## 0.11.0

### Minor Changes

- 553400c: React-style event type aliases, one type argument at the parameter:
  `(e: SubmitEvent<HTMLFormElement>) => …` (and `SubmitEvent` alone defaults to
  `HTMLFormElement`). The full set — `MouseEvent`, `KeyboardEvent`,
  `PointerEvent`, `TouchEvent`, `WheelEvent`, `DragEvent`, `FocusEvent`,
  `InputEvent`, `CompositionEvent`, `ClipboardEvent`, `AnimationEvent`,
  `TransitionEvent`, `UIEvent`, `SubmitEvent` — plus the generic
  `Targeted<Ev, E>` escape hatch. Each alias is the native DOM event narrowed
  to a concrete `currentTarget`; they shadow the globals when imported, exactly
  like React's — or use the namespace form to avoid shadowing:
  `import type { Events }` → `Events.MouseEvent<HTMLButtonElement>`. Types
  only — no runtime change.

### Patch Changes

- @continuum-js/frp@0.11.0

## 0.10.0

### Minor Changes

- 3f6aaad: Helper types for writing shared components, exported from the package root:
  `ComponentProps<"button">` / `ComponentProps<typeof Card>` (a tag's or a
  component's props, for wrapping and forwarding), `Reactive<T>` (a plain value
  or a `Behavior` of it — the type of every JSX attribute), `Ref<E>` and
  `EventHandler<Ev, E>`. Event handlers on intrinsic tags now type their
  `currentTarget` to the tag's element — `onSubmit` on a `<form>` gives
  `e.currentTarget: HTMLFormElement` with no cast, the native-event answer to
  React's `MouseEvent<HTMLButtonElement>`. Types only — no runtime change.

### Patch Changes

- @continuum-js/frp@0.10.0

## 0.9.0

### Minor Changes

- 8f7b67e: Lifecycle guard: `onCleanup`, `onMount` and `provide` called outside any
  owner (a component body, `root()`, `scope()`) now throw a teaching error
  instead of silently doing nothing — the old no-op meant cleanups that never
  ran and mount hooks nobody flushed. Building JSX with live bindings outside
  `mount` is still allowed (unowned fragments keep their old semantics), and
  `use()` outside an owner still returns the context default.

### Patch Changes

- Updated dependencies [1539199]
  - @continuum-js/frp@0.9.0

## 0.8.0

### Patch Changes

- @continuum-js/frp@0.8.0

## 0.7.0

### Minor Changes

- f2f2395: Typed JSX surface. `IntrinsicElements` is no longer `any`: attributes are
  derived per element from the DOM interfaces (`value`, `checked`, `href`, …),
  every attribute accepts a `Behavior<T>` in place of a plain `T`, event props
  are typed from `GlobalEventHandlersEventMap` in both native (`onKeydown`) and
  React-style (`onKeyDown`) casing, `ref` carries the tag's concrete element
  type, and `data-*`/`aria-*` are recognized. SVG elements keep a permissive
  attribute surface (events/ref/class stay typed); custom elements (a dash in
  the tag) accept arbitrary props. No runtime changes.

### Patch Changes

- @continuum-js/frp@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [02891f9]
  - @continuum-js/frp@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [a36a7ef]
  - @continuum-js/frp@0.6.0

## 0.5.0

### Minor Changes

- 20ecab7: Error boundaries. New `<Catch fallback={(error, reset) => …}>` component:
  catches a throw while building its children (children must be a thunk) and a
  throw during any nested dynamic-region rebuild, disposes the failed
  subtree's ownership, renders the fallback, and supports `reset`. An error in
  the fallback escalates to the next boundary up; without a boundary the old
  behavior (propagating throw) is unchanged.

  Core fixes shaken out by TDD: `Behavior.listen` now registers the listener
  BEFORE the initial delivery (a set fired while handling the initial value
  was silently lost) and unsubscribes if the initial delivery throws; a
  dynamic region whose render fires a re-entrant update no longer clobbers
  the newer result (epoch guard); a throw mid-`buildScoped` disposes the
  partial scope so no half-built ownership leaks.

### Patch Changes

- Updated dependencies [20ecab7]
  - @continuum-js/frp@0.5.0

## 0.4.1

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).
- Updated dependencies [a54119c]
  - @continuum-js/frp@0.4.1

## 0.4.0

### Minor Changes

- 5bdb51a: New `onMount(fn)` lifecycle hook: runs the callback once the current scope's
  nodes are inserted into the DOM — after `mount`, or right after `dyn`/`each`
  insert a freshly built subtree. Use it for focus, measurement, and third-party
  libraries that need a live element. Child scopes mount before their parents;
  callbacks registered in a scope that is disposed before insertion never run.

### Patch Changes

- @continuum-js/frp@0.4.0

## 0.3.1

### Patch Changes

- dc519c9: Two `dyn` correctness fixes uncovered by the router:

  - **Level-triggered rendering.** `dyn` now renders the behavior's current
    value instead of the delivered occurrence, so a listener that re-enters
    with a new moment during the post phase (e.g. a redirect) can no longer be
    clobbered by a stale queued update. Duplicate deliveries of the same value
    no longer rebuild the region.
  - **Range-based region sweep.** On rebuild, `dyn` removes everything between
    its markers rather than the recorded node list — a nested dynamic region
    at the root of the subtree (e.g. a lazy page) may have swapped nodes since
    the build, which previously leaked orphan nodes into the DOM.
  - @continuum-js/frp@0.3.1

## 0.3.0

### Minor Changes

- 20d707e: First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
  with proper `exports` maps (`@continuum-js/dom` also exposes `jsx-runtime` /
  `jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
  `npm i @continuum-js/dom` and build without any monorepo tooling.

### Patch Changes

- Updated dependencies [20d707e]
  - @continuum-js/frp@0.3.0
