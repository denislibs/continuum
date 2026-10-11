# @continuum-js/eslint-plugin

## 0.3.1

### Patch Changes

- c45823d: no-impure-combinators now flags the current pure joins State.at(e, f) and the free combine(...), and drops the removed snapshot/lift2/lift3 names.

## 0.3.0

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

## 0.2.0

### Minor Changes

- 5f3274a: `no-impure-combinators` now also flags `alert`/`confirm`/`prompt`, timers
  (`setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`),
  `requestAnimationFrame`/`requestIdleCallback`/`queueMicrotask`,
  `XMLHttpRequest` and `WebSocket` inside pure combinator callbacks. `console`
  stays deliberately unflagged — temporary debug logging in a reducer is
  harmless and common.

## 0.1.0

### Minor Changes

- 2c306c7: First release. Four rules that catch the "common mistakes" statically, in a
  flat-config `recommended` preset:

  - `no-impure-combinators` (error) — side effects (`fetch`, `localStorage`,
    `document`, setters/`dispatch`, `Date.now`/`Math.random`) inside
    `accum`/`accumE`/`snapshot`/`lift2`/`lift3` callbacks. `map`/`filter` are
    deliberately not flagged (Array collision) — the frp runtime purity guard
    covers those.
  - `no-sample-in-jsx` (error) — `sample()` rendered into JSX freezes the
    value; handlers are fine.
  - `require-retain` (warn) — module-level `hold`/`accum`/`snapshot`/lift
    derivations without `.retain()`.
  - `prefer-oninput` (warn) — `onChange` on text fields fires natively on
    blur; checkbox/radio/file/select are left alone.

  Usage: `import continuum from "@continuum-js/eslint-plugin"` →
  `export default [continuum.configs.recommended]`.
