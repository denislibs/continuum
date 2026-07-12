# @continuum-js/dom

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

- 9641ee2: Heap diet, round 6: 34% below Solid on the js-framework-benchmark memory metric (9.4 vs 14.1 MB at create 10k) and 2.8× faster moment throughput (5M sets: ~460 → 166 ms), with ~zero garbage per moment.

  - **Inline first edge.** Most nodes carry exactly one observer (binding chains); the first edge now lives in an inline slot and the `obs` array exists only from the second subscriber on — 30k arrays gone at 10k rows.
  - **Owner diet.** A single-node build stores the node itself (`nodes: Node | Node[]`), a list row IS its owner (`EachOwner.key` instead of a `{key, owner}` wrapper), and `disposed`/`mounted` are bits of one flags slot.
  - **Allocation-free moments.** The transaction is pooled (an aborted moment is never recycled; moment identity moved to a monotonic `t.id`), the heap array is lazy, `lastQ` holds flat (fn, arg) pairs written by cursor into a reused array, and every stateful node (cells, hold, accum, once, distinct, joins, selector) commits through one cached closure instead of a fresh one per moment. Profiling also showed `array.length = 0` is a V8 runtime call — the cursor scheme eliminates it.

  New harness: `npm run bench:heap` in benchmark/ — a CDP heap snapshot aggregated by constructor (who holds the bytes). Size budgets grew consciously by ~250 B (frp) for the inline-edge branches and the pool.

- Updated dependencies [9641ee2]
  - @continuum-js/frp@0.18.2

## 0.18.1

### Patch Changes

- a5ca1b3: Memory diet: below Solid on the js-framework-benchmark heap metric (11.5 vs 14.1 MB at create 10k) and on create-10k script time (34.05 vs 39.85 ms, same session), with the selector() retention bug fixed.

  - **selector() evicts idle cells.** A key's cell is removed from the internal map once its last listener detaches (leaf nodes now fire `onSleep` on losing their last observer); re-requesting the key hands out a fresh cell seeded from the current selection. 10k cleared rows used to retain ~2.9 MB forever.
  - **`wire()` cell fused into its wire** — one object instead of the Cell + Wire pair, a shared pull function instead of a per-cell closure, and bound `set`/`update` fields instead of an `Object.assign` that forked the wire's hidden class: 568 → 320 B per cell.
  - **Leaf `listen()` without the wrapper closure** — a sentinel edge target marks leaf observers and `send_` schedules the user callback into the observer phase directly: 313 → 217 B per subscription.
  - **DOM bindings as flat (stream, edge) pairs on the owner** (`observe_`/`unobserve_`, internal) — a binding costs two array slots instead of two closures plus a cleanups slot.

  Size budgets grew consciously by 50–85 B per package.

- Updated dependencies [a5ca1b3]
  - @continuum-js/frp@0.18.1

## 0.18.0

### Patch Changes

- 06378b2: Аллокационная диета (перф-раунд 2, по CDP-профилю create 10k):

  - **frp**: коллекции узла Stream (listeners/targets/cleanups) и массивы
    Scope (cleanups/children) аллоцируются лениво — холодная производная
    больше не платит ни одной коллекцией за существование; GC выпал из
    топа профиля create-heavy сценария.
  - **dom**: each() вставляет серии свежих строк одним DocumentFragment
    (было insertBefore на строку); jsx-runtime зовёт компоненты напрямую с
    props автоматического рантайма (−3 аллокации на вызов; детям больше не
    гарантируется массив — `Child` это и так покрывает); прекомпьютнутые
    ключи делегирования; Wire-first диспатч insertChild.

  Компилированный путь create 10k: ~1.57× от Solid в одной сессии (было
  2.4× у фактори до компилятора). Дальше — плато: остаток это нативные
  вызовы и метаданные двух законов; подробности в benchmark/BASELINES.md.

- 9a0e1c9: Перф-раунд 3: представление рёбер графа + `selector()`.

  - **Рёбра-слоты**: подписка — Edge-рекорд в параллельном массиве со
    свап-удалением вместо Set слушателей + refcounted Map таргетов +
    замыкания на отписку; распространение рангов ходит по тем же рёбрам.
    Teardown 100k подписок: 103 → 18 мс (5.8×); создание ребра дешевле на
    ~10%. Тонкость: относительный порядок двух выживших слушателей после
    чужой отписки может измениться (как у слотов Solid); порядок эффектов
    внутри момента — по-прежнему порядок доставки.
  - **postQ без замыканий**: пост-фаза хранит плоские (fn, arg)-пары —
    минус аллокация на каждую доставку каждому слушателю.
  - **Новое: `selector(w)` / `selector(w, on, off)`** — выделение по ключу
    с O(2) обновлениями: один следящий процесс + крошечная ячейка на ключ,
    оба флипа в одном моменте (закон 2 соблюдён, аборт бесследен). Строкам
    списка больше не нужен map-узел на каждую: `class={rowClass(row.id)}`.
    Требует скоуп (компонент или root()).

  Бенч (одна сессия, script): create 10k — 1.34× от Solid (было 1.57×),
  select row — 0.1 мс против 0.3 у Solid. Подробности в
  benchmark/BASELINES.md.

- 51d4e10: Перф-раунд 4 «объектная диета» — паритет с Solid по созданию DOM.

  - **frp**: битфлаги вместо булевых полей и аудит полей Stream (11 → 9;
    live — interleaved, srcs — плоские пары); Cell — класс на прототипе
    вместо фабрики замыканий; инлайн первой prioritized-записи транзакции —
    куча включается только со второй (пропускная способность моментов +36%:
    каждый set/fire в каждом приложении); fused `accum` — один узел и одно
    ребро вместо пары accumE+hold.
  - **dom**: buildScoped возвращает Owner как есть (минус объект и два
    замыкания на каждую строку each/перестройку dyn); примитив в пустой
    родитель пишется через textContent.

  Бенч (одна сессия, script): create 10k — 33.9 мс против 32.2 у Solid
  (**1.05×**, было 1.34×); select row — 0.1 мс (втрое быстрее Solid);
  µбенч: рёбра-teardown 13 мс/100k, моменты 500k — 41 мс. История
  оптимизаций и методология — benchmark/BASELINES.md.

- Updated dependencies [06378b2]
- Updated dependencies [9a0e1c9]
- Updated dependencies [51d4e10]
  - @continuum-js/frp@0.18.0

## 0.17.0

### Minor Changes

- f0b1ddf: Перф-раунд create-пути (PERF-PLAN, фазы 0–2).

  **dom**: пузырящиеся события делегируются одним document-слушателем на тип
  (хендлер живёт на элементе и умирает с ним — ноль addEventListener и ноль
  cleanup-замыканий на строку списка; контракт как у Solid: делегированным
  событиям нужна связность с документом). each() восстанавливает фокус только
  если перестановка его реально украла. Внутренний сабпат
  `@continuum-js/dom/compiled` — рантайм клонируемых шаблонов.

  **Миграция тестов**: клики в тестах должны пузыриться и дерево должно быть
  подключено к документу — `container` прикрепляйте к `document.body` (helper
  `render()` из `@continuum-js/test` уже делает это), события диспатчьте с
  `{ bubbles: true }` (нативный `.click()` пузырится сам).

  **Новый пакет `@continuum-js/vite-plugin`** — опциональный компилятор JSX:
  тот же код компилируется в template+clone (статика — одна HTML-строка на
  call-site, динамика — дырки с теми же привязками, что у фактори; спреды/
  SVG/непонятное — честный фолбэк). Без плагина всё работает как раньше. Шаблон CLI включает плагин по умолчанию (смоук гоняет скаффолд через компилятор).
  Замеры (script-время): create 1k 7.6→4.9 мс, create 10k 69.5→45.4 мс,
  append 6.8→4.1 мс — разрыв с Solid сжат с 2.3–2.4× до 1.4–1.6×. Двойной
  прогон тестов (с компиляцией и без) — в CI: `npm run test:compiled`.

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
