# @continuum-js/std

## 1.0.0

### Major Changes

- 2a57a2c: Continuum 1.0: the API freeze. One name per concept — every deprecated alias accumulated by the three renames and the polish rounds is removed. Semantics, transactional guarantees and performance are exactly those of 0.19.

  **Removed** (see the [migration guide](https://denislibs.github.io/continuum/migration-1.0) and `scripts/codemod-1.0.mjs`, which rewrites the mechanical part automatically):

  - `Wire`/`wire`/`WireSource`, `Behavior`, `Event`/`newEvent` → `State`/`state`/`StateSource`, `Stream`/`newStream`
  - `newBehavior(init)` tuple → `state(init)` (one value with `.set`)
  - `e.snapshot(b, f)` → `b.at(e, (value, event) => …)`
  - `e.gate(b)` → `e.when(b)`; `ea.orElse(eb)` → `ea.or(eb)`
  - `Wire.apply`/`lift2`/`lift3` → `combine(...)`; `Wire.switchB`/`switchE` → `flatten(w)`
  - std: `distinctB` → `dedupe`

  Also in this release: English-first package READMEs (Russian moved to README.ru.md), the docs repositioned around what makes Continuum different (change as data: command streams, transactional updates, race-free async), and size budgets tightened after the alias removal (dom+frp: 6.3 kB brotli).

### Patch Changes

- Updated dependencies [2a57a2c]
  - @continuum-js/frp@1.0.0

## 0.19.0

### Minor Changes

- ed8adb8: `Wire` is now `State` — the third and last rename (the Event → Stream playbook): `Wire` read as nothing to anyone outside the project, while `state` is the word every React/Vue/Svelte developer already thinks in. Signal was considered and rejected: Continuum has no auto-tracking, and the name would promise Solid semantics.

  - `class State<A>`, factory `state(init, eq?)` with `.set`/`.update`/`.on`, interface `StateSource<A>`; the dom helper type is `Reactive<T> = T | State<T>`.
  - **Nothing breaks**: `Wire`, `wire`, `WireSource` (and the older `Behavior`) remain as deprecated aliases until 1.0 — existing code keeps compiling and running unchanged.
  - Docs (en + ru), examples, the benchmark app and the CLI template all speak `state()` now.

### Patch Changes

- Updated dependencies [ed8adb8]
  - @continuum-js/frp@0.19.0

## 0.18.2

### Patch Changes

- Updated dependencies [9641ee2]
  - @continuum-js/frp@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [a5ca1b3]
  - @continuum-js/frp@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [06378b2]
- Updated dependencies [9a0e1c9]
- Updated dependencies [51d4e10]
  - @continuum-js/frp@0.18.0

## 0.17.0

### Patch Changes

- @continuum-js/frp@0.17.0

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

- @continuum-js/frp@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [7952800]
  - @continuum-js/frp@0.12.0

## 0.11.0

### Patch Changes

- @continuum-js/frp@0.11.0

## 0.10.0

### Patch Changes

- @continuum-js/frp@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [1539199]
  - @continuum-js/frp@0.9.0

## 0.8.0

### Minor Changes

- b83d961: `persist(key, behavior, storage?)` and `loadPersisted(key, fallback,
storage?)` — localStorage persistence as a boundary sink. Safe by contract:
  corrupted JSON or missing storage (SSR) falls back instead of throwing, a
  throwing `setItem` (quota, private mode) is swallowed so the network never
  breaks because a mirror did. `persist` returns the unlisten — tie it to a
  scope with `onCleanup(persist(key, b))`. The `storage` parameter accepts any
  `StorageLike`, which also makes both functions trivially testable.

### Patch Changes

- @continuum-js/frp@0.8.0

## 0.7.0

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

### Patch Changes

- @continuum-js/frp@0.4.0

## 0.3.1

### Patch Changes

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
