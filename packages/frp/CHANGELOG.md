# @continuum-js/frp

## 0.16.0

### Minor Changes

- 8b043ed: `wire().update(f)` — «прочитай и измени» без ловушки батча.

  `count.update((n) => n + 1)` фолдит апдейтер над значением, застейдженным
  **текущим моментом**: несколько `update` внутри одного `batch` компонуются
  (+2, а не +1), тогда как `set(count.sample() + 1)` дважды прочитал бы
  домоментное значение (задержка hold работает как задокументировано).
  Отдельный метод, а не перегрузка `set` — для wire, хранящего функцию,
  никакой двусмысленности «значение или апдейтер». Равный результат
  пропускается по eq ячейки; подписчики получают одно коалесцированное
  вхождение на момент. Доки и шаблон переведены на `update()` в
  read-modify-write примерах; соответствие из React теперь дословное:
  `setCount((c) => c + 1)` ↔ `count.update((n) => n + 1)`.

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

## 0.14.0

### Minor Changes

- 56a078e: Активация по спросу: производные подключаются при первом слушателе.

  - **Чистые производные (`map`/`filter`/`snapshot`/`gate`/`merge`/`lift*`) —
    ленивые**: до первого слушателя это рецепт, не подключённый к источнику;
    первый слушатель подключает цепочку вверх до источников, последний
    ушедший — отключает. Брошенная цепочка не держится источником и
    собирается GC. `sample()` работает всегда — тёплым и холодным, pull
    пересчитывает по рецепту.
  - **Ошибка «disposed after its last listener unsubscribed» удалена**:
    узел после ухода последнего слушателя не умирает, а засыпает — новый
    слушатель будит его. Шаринг производной между маунтами просто работает.
  - **`retain()` стал перф-подсказкой** («держать подключённой при текучке
    слушателей»), а не обязательным знанием.
  - **`lift2`/`lift3` пересеивают кэши при пробуждении** — заодно вылечен
    замороженный push-путь при комбинировании с непрерывными behaviors
    (`fromPoll`/`time`), созданными до подписки.
  - **Стейтовые производные (`hold`/`accum`) остаются eager** (их значение
    зависит от каждого вхождения), но получают жнеца: когда обёртка
    становится недостижимой, FinalizationRegistry отцепляет цепочку от
    источника после сборки мусора — класс утечки «создал, сэмплил, бросил,
    ни разу не слушал» получил гарантированный конец. На рантаймах без
    FinalizationRegistry — прежнее поведение.
  - `accumE` хранит аккумулятор в ячейке со стейджингом вместо внутреннего
    hold (семантика идентична, но скрытый само-слушатель больше не держит
    цепочку от жнеца).
  - Семантика рангов: холодные узлы входят в живую топологию при пробуждении;
    подъём рангов каскадирует только по подключённому подграфу.
  - **Аудит вдогонку**: волна пробуждения итеративная (глубокая холодная
    цепочка не переполняет стек — worklist, как у ensureBiggerThan); пересев
    кэшей lift при пробуждении внутри момента отложен в следующий last-батч
    (rewire switch больше не может прочитать незакоммиченный hold); доставка
    `send_` идёт по кэшированному снапшоту слушателей — ноль аллокаций на
    стабильном фан-ауте (200 моментов × 10k слушателей: 108 → 50 мс);
    ошибка disposed говорит про dispose()/жнеца вместо удалённого
    авто-диспоза; dyn()/each()/portal() вне владельца бросают обучающее
    «needs an owner» вместо внутренностей onCleanup.

## 0.13.0

### Minor Changes

- 944371c: Полировка ядра: `batch`, равенство в `newBehavior`, итеративные ранги.

  - **`batch(fn)`** — публичный способ выполнить несколько `fire`/`set` одним
    моментом: соединения пересчитываются один раз, merge коалесцирует,
    наблюдатели срабатывают однажды после закрытия момента. Вложенный `batch`
    присоединяется к объемлющему моменту. Двойной `fire` одного потока в одном
    моменте — громкая ошибка (иначе `accum` молча терял бы свёртку); повторный
    `set` одного behavior легален — last write wins.
  - **`newBehavior` пропускает равные значения**: установка значения, равного
    текущему (по `Object.is`), — no-op, подписчики не просыпаются. Своё
    сравнение — вторым аргументом, `() => false` отключает пропуск. Сравнение
    идёт с последним «отправленным» значением, поэтому внутри `batch`
    последовательность 4 → 5 → 4 честно коммитит 4.
  - **Подъём рангов (`ensureBiggerThan`) стал итеративным**: каскад по очень
    глубокой цепочке (десятки тысяч узлов) больше не переполняет стек вызовов;
    быстрый путь не аллоцирует. Детекция циклов по текущему пути сохранена.
  - **Отписка стала O(1)** — слушатели узла хранятся в Set вместо массива
    (был indexOf+splice). Массовый демонтаж 20k привязок одного источника:
    110 мс → 1.6 мс. Порядок наблюдателей (FIFO) и семантика снапшота при
    доставке сохранены и зафиксированы тестами.

## 0.12.1

## 0.12.0

### Minor Changes

- 7952800: The Sodium rename, for the Sodium reason: `Event` is now **`Stream`**
  (`newEvent` → **`newStream`**). To most people an "event" is one occurrence,
  while this type is the whole stream of them — and the old name collided with
  the DOM's global `Event`, forcing `globalThis.Event` dances in typed code.
  `Event` and `newEvent` remain as deprecated aliases (same objects, IDE shows
  the strikethrough and the replacement) and will be removed in 1.0. Nothing
  else is renamed: `map`/`hold`/`snapshot`/`accum` stay canonical Sodium
  vocabulary, `accumE`/`switchE` keep their names.

## 0.11.0

## 0.10.0

## 0.9.0

### Minor Changes

- 1539199: Purity guard: firing a source from inside a pure combinator callback
  (`map`/`filter`/`snapshot`/`accum`/lift) now throws a teaching error instead
  of silently joining the moment being computed — the old behavior injected an
  occurrence into a half-drained graph, losing or reordering updates. Effects
  belong at the boundary: handlers, `listen`, `perform`. Batching several sets
  in one `Transaction.run` body and setting from post-phase listeners keep
  working unchanged.

## 0.8.0

## 0.7.0

## 0.6.1

### Patch Changes

- 02891f9: Stable ranks under switch (roadmap §14 #6). Rank-propagation targets are
  now refcounted and removed on unsubscribe (a long-lived source used to
  accumulate one dead entry per mount/unmount cycle, slowing every rank bump
  and pinning dead subtrees in memory). switchB/switchE rebase their rank
  back down to the live topology on rewire, so a visit to a deep chain no
  longer inflates ranks forever. A dependency cycle woven through switches
  now fails loudly: the ordinary cycle detector sees the live topology once
  dead targets are gone, and a RANK_LIMIT backstop catches exotic temporal
  cycles with a descriptive error.

## 0.6.0

### Minor Changes

- a36a7ef: Leak fix + `retain()`. The stress suite caught a real core leak: every
  `{b.map(f)}`-style binding on a behavior that outlives its component left
  the derived chain subscribed to the source forever (10k mount/unmount
  cycles = 10k dead listeners). The public `listen` unsubscribe now completes
  the in-graph cascade the engine already had: a derived node whose last
  listener leaves detaches from its inputs.

  Semantics consequence: a derivation shared across mounts (created once at
  module level) auto-disposes after its first consumer unmounts — re-using it
  now throws a descriptive error instead of going silently dead. For
  intentionally long-lived shared derivations there is the new
  `retain()` (on both `Event` and `Behavior`): it exempts the node from the
  cascade. `newBehavior` retains its internal hold automatically — source
  behaviors are unaffected by any of this.

## 0.5.0

### Patch Changes

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

## 0.4.1

### Patch Changes

- a54119c: Ship the MIT LICENSE file inside every published package (the license was
  declared in package.json but the file itself was missing from tarballs).

## 0.4.0

## 0.3.1

## 0.3.0

### Minor Changes

- 20d707e: First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
  with proper `exports` maps (`@continuum-js/dom` also exposes `jsx-runtime` /
  `jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
  `npm i @continuum-js/dom` and build without any monorepo tooling.
