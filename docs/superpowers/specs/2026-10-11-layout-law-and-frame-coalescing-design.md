# Закон 3: layout — это эффект. Кадровый режим планировщика. Devtools.

_Дизайн, 2026-10-11. Статус: на ревью._

## 1. Зачем

Два класса проблем, которые всплывут на любом крупном приложении (конкретный повод — клиент Telegram Web A на Continuum), и которые teact решает глобальным rAF-планировщиком, а мы должны решить внутри синхронной транзакционной модели:

- **A. Layout thrashing.** Пользовательский код читает layout (`offsetHeight`, `getBoundingClientRect`, `scrollTop`…) в фазе наблюдателей — там же, где движок пишет DOM. Чередование запись→чтение форсирует reflow на каждое чтение.
- **B. Структурная перестройка чаще кадра.** Пачка моментов между кадрами (WebSocket-апдейты, ответы сети) = пачка перестроек `each`/`dyn`, хотя отрисован будет один кадр.

Решение не трогает закон синхронности: момент по-прежнему закрывается до возврата из `set()`. Оно добавляет **третий закон модели** и один комбинатор.

### Не-цели

- Асинхронный/rAF-отложенный рендер, `requestMutation`, MutationObserver-детектор записей — записи у нас законны всегда и синхронны.
- Time-slicing / concurrent-режим.
- Гарантия «по построению» против сырого `el.offsetHeight` в эффекте: в JS она недостижима (у teact тоже). Гарантия даётся как закон — runtime-guard + lint + API, которое делает правильно по умолчанию — ровно так же, как закон 1 (чистота комбинаторов).

## 2. Закон 3 (формулировка для FRP-MODEL)

> **Layout — это внешний мир.** Он входит в сеть как State (observer'ы браузера) или через `measure` — эффект, батчируемый по кадру. Фаза наблюдателей момента (commit и effects) и `onMount` — **зона эффектов**: чтение layout там запрещено. Исключение помечается явно: `forceMeasure(fn)`.

Опоры закона (как у закона 1):

| слой                        | закон 1 (чистота)       | закон 3 (layout)                                            |
| --------------------------- | ----------------------- | ----------------------------------------------------------- |
| API по умолчанию правильное | `perform`, `.on`        | `createSize`, `createVisibility`, `createScroll`, `measure` |
| runtime-guard               | `pureZone` → throw      | `effectZone` + пропатченные геттеры (devtools, dev-only)    |
| статика                     | `no-impure-combinators` | `no-layout-reads-in-effects`                                |
| документация                | FRP-MODEL §5            | FRP-MODEL новый §, гайд «Layout is an effect» (en + ru)     |

## 3. Изменения по пакетам

### 3.0 `@continuum-js/frp` — кадровый проход как единственный режим наблюдателей (решение: **frame-only**)

Спайк показал цифры (§8), после чего sync-режим **удалён**, не оставлен опцией. Граф синхронен (`sample()` актуален до возврата из `set()`); наблюдатели бегут одним проходом на кадр (rAF + фолбэк 35 мс): measures → bindings → effects. Биндинги и `State.listen` — level (одна доставка на кадр, последнее значение); `Stream.listen`/`perform` — edge (каждое происшествие). Наблюдатель, отписанный до своей очереди, не вызывается. `flushFrame()` — escape hatch для «записал → прочитал DOM». `requestMeasure` — основа для `measure()` из 3.3. Проблема B закрыта без `coalesce`.

Сделано: frp, `animationFrames()` флашит после тика, test-хелперы флашат, 454 теста мигрированы, доки en/ru + FRP-MODEL, changeset (frp/dom major, test minor, std patch), бюджеты подняты под стоимость планировщика (~300 B).

### 3.1 `@continuum-js/frp` — commit → effects, зона эффектов, dev-хуки

**Две post-очереди вместо одной.** Сейчас биндинги движка (`observe_`) и пользовательские `listen` помечены одним sentinel `POST` и бегут FIFO вперемешку. Второй sentinel `POST_EFFECT` уже введён спайком 3.0 (`listen` → `POST_EFFECT`, `observe_` → `POST`); остаётся упорядочить sync-дренаж:

- `observe_` (dom-биндинги, регионы, mount-flush) → `POST` → очередь **commit**;
- `Stream.listen` / `State.listen` (пользовательские эффекты, `perform`, `persist`) → `POST_EFFECT` → очередь **effects**.

`Transaction.run` после закрытия момента дренирует commit, затем effects. Изоляция ошибок как сейчас: каждый колбэк в try/catch, первая ошибка перебрасывается после обеих очередей.

**Гарантия порядка (новая, документируемая):** внутри одного момента все DOM-записи движка завершены до запуска первого пользовательского эффекта. Эффект видит законченный DOM; чтение layout в эффекте даёт максимум один reflow на момент (смягчение, не лекарство — лекарство в 3.2).

**`Transaction.effectZone`** — `@internal` статический счётчик, > 0 пока дренируются обе post-очереди (вложенные моменты из эффектов только увеличивают его). dom дополнительно инкрементирует его вокруг `flushMounts` (см. 3.2). Devtools читает его из пропатченных геттеров.

**Dev-хуки** — `@internal` `setDevHooks(h | null)`; `h = { scope?(delta: 1 | -1), edge?(delta: 1 | -1), moment?() }`. Вызовы в `Scope` (constructor / dispose), `attach_` / `unlisten_`, `Transaction.run`. В проде хук `null`, стоимость — одна проверка. Бюджет: ожидаемо ≤ 200 B gz из запаса 4.15 kB; проверяется `npm run size` в плане, при превышении хуки урезаются до `scope`/`edge`.

Rank-машинерия пропускает оба sentinel'а (сейчас пропускает один).

### 3.2 `@continuum-js/dom` — ядро: только зона эффектов и мелочь делегирования

В основной entry (под бюджетом 6.35 kB) добавляется минимум:

- `flushMounts` инкрементирует/декрементирует `Transaction.effectZone` — `onMount` всегда зона эффектов, и при первом `mount()`, и при перестройке региона (единообразие для пользователя).
- `delegatedDispatch`: после обхода удалять переопределённое `currentTarget` (`delete e.currentTarget`), чтобы объект события не носил последний узел вечно (Б12 из ревью). `stopImmediatePropagation`, Shadow DOM, focus/blur-делегирование — **не меняются**: `focus`→`focusin` меняет семантику (родитель начнёт ловить фокус детей), direct-листенеры остаются.
- `each`: единственное чтение layout движком — `doc.activeElement` + `active.focus()` после перемещения. `focus()` форсирует layout. Оборачивается во внутренний `withLayout(fn)` (обнуление `effectZone` на время `fn`; `forceMeasure` из `/layout` — его публичный реэкспорт), поведение не меняется.

### 3.3 `@continuum-js/dom/layout` — новый subpath-entry (вне size-limit, tree-shakeable)

```ts
// Источники: браузер сам отдаёт посчитанные значения после layout, до paint — ноль форсированных reflow'ов.
createSize(el: Element): State<{ width: number; height: number }>       // ResizeObserver (contentRect)
createVisibility(el: Element, opts?: IntersectionObserverInit): State<boolean> // IntersectionObserver
createScroll(el: Element | Window): State<{ top: number; left: number }>  // scroll-событие, passive

// Escape hatch для того, чего observer'ы не дают (scrollHeight после вставки, offsetTop, computed style).
measure<A, B>(trigger: Stream<A>, read: (a: A) => B): Stream<B>
forceMeasure<T>(fn: () => T): T

// Heavy animation (см. 3.4 для гейта).
beginHeavyAnimation(durationMs = 1000): () => void   // возвращает end; счётчик вложенных
isHeavyAnimating: State<boolean>
```

Все `createX` — scope-зависимые (регистрируют `onCleanup`), по конвенции репо. Начальное значение `createSize`: `{0,0}` до первого колбэка RO (RO всегда вызывается сразу после `observe`, в том же кадре); документируется.

**Семантика `measure`:**

- Эффект — требует scope (как `perform`); при dispose очередь узла очищается, поздние кадры ничего не выстреливают.
- На каждое срабатывание `trigger` (фаза наблюдателей) запоминается **последний** аргумент; узел ставится в кадровую очередь, если ещё не стоит. **Не более одного чтения на узел на кадр** — Stream несёт не более одного события за момент, кадр = момент (см. ниже). Промежуточные триггеры теряются, читается последний аргумент; документируется.
- Планировщик кадра — один на модуль: `requestAnimationFrame` + **fallback `setTimeout(35 мс)`** на случай фоновой вкладки, где rAF не стреляет (иначе логика, зависящая от измерения, зависает). Кто первый — тот и дренирует, второй отменяется.
- Дренаж: `Transaction.effectZone` **не** поднимается (это measure-фаза, чтения законны). Выполняются все `read` подряд в порядке постановки — DOM в этот момент никто не пишет, reflow максимум один. Результаты собираются, затем **`batch(() => fire(result) для каждого)`** — один момент, все зависящие записи в одной commit-фазе. Так кадр становится одним моментом результатов.
- Ошибки `read`: как у наблюдателей — каждый в try/catch, остальные выполняются, первая перебрасывается после `batch`. Без `Result`: чтения синхронны и не сетевые.
- `forceMeasure(fn)`: временно обнуляет `effectZone` на время `fn` (сохранив счётчик), чтобы devtools и lint видели явное намерение. Для сторонних виджетов в `onMount`.

**`animationFrames()` не получает fallback**: анимации в фоновой вкладке должны останавливаться — это поведение, а не баг (ранняя оценка в обсуждении была ошибочной).

### 3.4 `@continuum-js/std` — гейт

```ts
holdWhile<T>(b: State<T>, gate: State<boolean>): State<T>
```

(`coalesce` из первой редакции **убран**: проблему B закрывает кадровый режим планировщика, см. 3.0.)

- **`holdWhile`** — пока `gate` истинен, значение `b` замораживается; при переходе `gate` в false выдаётся текущее значение `b` (если отличается от замороженного, по `Object.is`). Формула: `source()`-ленивая, reseed на wake, как `dedupe`. Применение: `each(holdWhile(items, isHeavyAnimating), …)`. Отдельного `defer`-пропа у `Each`/`Dynamic` **нет** (YAGNI; комбинатор виден в коде и композируется).
- Под законы ядра (ленивая формула), с тестом на отсутствие подписок после последнего слушателя — урок #117.

### 3.5 `@continuum-js/eslint-plugin` — `no-layout-reads-in-effects`

Ошибка на обращение к свойству/методу из списка layout-триггеров (`layoutCauses`: `offsetWidth/Height/Top/Left/Parent`, `client*`, `scroll*` (чтение), `getBoundingClientRect`, `getClientRects`, `getComputedStyle`, `innerText`, `focus`, `scrollIntoView`, `elementFromPoint`, `window.innerWidth/Height`, …) внутри колбэков `listen`, `onMount`, `perform`, `bindState`, `.on` — кроме как внутри колбэка `measure(...)` или `forceMeasure(...)`. Реализация — по образцу `enclosingPureCombinator`/`IMPURE_GLOBALS`: тот же обход предков, другой список. Входит в `recommended`. Текст ошибки ведёт к `createSize`/`measure`/`forceMeasure`.

### 3.6 `@continuum-js/devtools` — новый пакет, dev-only

```ts
installDevtools(opts?: {
  strictLayout?: boolean;   // default true
  overlay?: boolean;        // default true
  onViolation?: (err: Error) => void; // default: throw
}): () => void              // uninstall
```

- **strictLayout**: патчит геттеры/методы из `layoutCauses` (список — порт `teact/lib/fasterdom/layoutCauses.ts`, gist Paul Irish) на прототипах `Element`, `HTMLElement`, `window`, `VisualViewport`, `Document`, `HTMLInputElement`, `MouseEvent`, `Range`. В обёртке: если `Transaction.effectZone > 0` → `onViolation(new Error("Layout read \`offsetHeight\` inside an effect — move it into measure()/createSize(), or wrap in forceMeasure()"))`. Оригиналы сохраняются; `uninstall` восстанавливает. MutationObserver-части нет.
- **overlay**: фиксированный `<div>` с троттлингом 500 мс: живые scope'ы, живые edges (подписки), моментов/сек, эффекты дольше 7 мс (имя — из `Error().stack`, best effort), число нарушений layout. Кнопка сброса. Данные — через `setDevHooks` из frp; счётчики подписок — ровно то, чем ловится класс утечек #117.
- Зависимости: peer `@continuum-js/frp`, `@continuum-js/dom`. Вне size-limit. Подключение: `if (import.meta.env.DEV) installDevtools()` в `main.tsx`; шаблон `create-continuum` получает эту строку.

### 3.7 Документация (en + ru зеркально)

- FRP-MODEL: закон 3, гарантия commit→effects.
- Новый гайд `guides/layout.md`: три источника, `measure` с примером скролл-якоря, `forceMeasure`, frame-режим для входящих потоков, `holdWhile` + `beginHeavyAnimation`.
- `concepts/ownership.md`: `onMount` — зона эффектов.
- README devtools.

## 4. Пример: скролл-якорь при подгрузке истории

```ts
const before = measure(loadRequested, () => ({
  h: list.scrollHeight,
  top: list.scrollTop,
}));
const after = measure(messagesInserted, () => list.scrollHeight);
before
  .hold(null)
  .at(after, (b, h2) => b && b.top + (h2 - b.h))
  .listen((top) => {
    if (top != null) list.scrollTop = top;
  });
```

`messagesInserted` срабатывает синхронно при вставке; `after` читается в rAF **до** paint того же кадра; `list.scrollTop = top` — запись в фазе эффектов; пользователь прыжка не видит. Запись `scrollTop` — не чтение, lint флагует только чтение (поэтому не `+=`: он читает).

## 5. Тестирование (TDD, по пакетам)

- frp: порядок commit→effects внутри момента; вложенный момент из эффекта не нарушает порядок внешнего; ошибки в обеих очередях изолированы и первая перебрасывается; `effectZone` поднят в post-фазе и в `onMount`, опущен в `measure`-дренаже и внутри `forceMeasure`; dev-хуки считают scope/edge корректно (включая swap-removal).
- dom/layout: `createSize` через мок RO (jsdom без RO — инжектируемый конструктор); `measure` — один `read` на кадр при двух триггерах, последний аргумент; результаты нескольких `measure` в одном `batch` (один момент — проверяется счётчиком наблюдателя `combine`); fallback-таймер стреляет при отсутствии rAF; dispose отменяет pending.
- std: `holdWhile` — заморозка, выдача при освобождении, дедуп, ленивость.
- eslint: позитив/негатив по списку, `measure`/`forceMeasure` как исключения, запись `el.scrollTop = x` не флагается.
- devtools: нарушение внутри `listen` → `onViolation`; внутри `measure` и `forceMeasure` — нет; `uninstall` восстанавливает прототипы.
- Smoke: шаблон с `installDevtools` собирается и tree-shake'ится из prod-бандла (size-limit на `template` не нужен — проверка `grep` в `vite build` output в smoke).

## 6. Бюджеты, релиз

- `npm run size` обязателен после frp/dom/std изменений; `size-limit` сейчас не установлен локально — `npm ci` в плане.
- Changesets: `frp` minor (новая гарантия порядка — наблюдаемое поведение), `dom` minor (`/layout`), `std` minor, `eslint-plugin` minor, `devtools` — первый релиз 0.1.0, `create-continuum` patch.

## 7. Решения

Утверждены 2026-10-11:

1. Гейт heavy-animation — только `holdWhile(state, gate)` в std; `defer`-пропа у регионов нет.
2. `measure` — одно чтение на кадр, `read` получает **последний** аргумент; промежуточные триггеры теряются.
3. `onMount` — зона эффектов всегда (и первый `mount()`, и перестройка региона); исключение — `forceMeasure`.

Утверждены там же, вторым заходом:

4. Ошибки `read` в `measure` — как у наблюдателей: остальные чтения кадра выполняются, первая ошибка перебрасывается после `batch()`; тип `Stream<B>`, без `Result`.
5. `focus`/`blur` остаются direct-листенерами (платформенная семантика: не всплывают); делегирование — через `onFocusin`/`onFocusout` по желанию. Shadow DOM и `stopImmediatePropagation` вне scope.
6. `animationFrames()` в фоновой вкладке останавливается; таймаут-фолбэк только у планировщика `measure`.
7. Overlay — пять счётчиков: живые scope'ы, живые подписки, моментов/сек, эффекты дольше 7 мс, нарушения layout. Per-источник — позже.

## 8. План работ (ветка `feat/teact-learnings`)

Всё, что выросло из разбора teact, живёт в одной ветке. Каждый шаг — красный тест → код → `npm run size` → changeset.

| #   | Шаг                                                                                                                                                                                                                                                   | Пакеты                     | Выход                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| 1   | Кадровый проход — **сделано, единственный режим**: frp, test-хелперы, `animationFrames`, миграция тестов, доки, changeset                                                                                                                             | frp, dom, test, docs       |                                                                                   |
| 2   | Закрыть 4 открытых решения (§7, п. 4–7)                                                                                                                                                                                                               | спека                      | —                                                                                 |
| 3.1 | commit→effects, `effectZone`, dev-хуки                                                                                                                                                                                                                | frp                        |                                                                                   |
| 3.2 | `holdWhile`                                                                                                                                                                                                                                           | std                        |                                                                                   |
| 3.3 | `effectZone` вокруг `flushMounts`, `withLayout` для фокуса в `each`, очистка `currentTarget`                                                                                                                                                          | dom                        |                                                                                   |
| 3.4 | `createSize`/`createVisibility`/`createScroll`, `measure`, `forceMeasure`, `beginHeavyAnimation`                                                                                                                                                      | dom/layout                 |                                                                                   |
| 3.5 | `no-layout-reads-in-effects`                                                                                                                                                                                                                          | eslint-plugin              |                                                                                   |
| 3.6 | Пакет devtools: strictLayout, overlay; строка в шаблоне                                                                                                                                                                                               | devtools, create-continuum |                                                                                   |
| 3.7 | FRP-MODEL закон 3, `guides/layout.md` en+ru, ownership.md                                                                                                                                                                                             | docs                       |                                                                                   |
| 4   | **Per-row `State<T>` в `each`**: мини-спека (API: второй аргумент children `(item: State<T>)` или `eachRow`; реюз строки → `cell.set(item)`), тесты на Б4-сценарий, бюджет dom                                                                        | dom, docs                  | закрывает Б4/П3 из ревью                                                          |
| 5   | **Хвост ревью**: Б6 (пропуск splice при `parent.disposed`), Б7 (enumerated-атрибуты `draggable`/`spellcheck`/`contenteditable`/`translate`/`autocapitalize` → `"false"`), Б9 (try/catch вокруг sync `run` в `perform`), Б14 (текст ошибки `makeFire`) | frp, dom                   | 4 маленьких TDD-фикса, один changeset на пакет                                    |
| 6   | **Спайк клиента `examples/tweb-a`**: `MessageList` с виртуальным окном, подгрузкой вверх со скролл-якорем (`measure`), живыми апдейтами (per-row State), `setSchedule("frame")`, `holdWhile` на открытии чата; mock-источник апдейтов                 | examples                   | проверка всей связки на реальном сценарии; что не работает — возвращается в 3.x/4 |
| 7   | Финал: `test`/`typecheck`/`lint`/`size`/`smoke`, один PR с changesets                                                                                                                                                                                 | —                          |                                                                                   |

Порядок 4 → 6 важен: спайк клиента без per-row State не имеет смысла (строки не обновляются). Шаг 5 независим, можно в любой момент.

### Результаты шага 1 — спайк `schedule: "frame"` (2026-10-11)

Реализовано в `frp` (ветка `feat/teact-learnings`): `setSchedule("sync" | "frame")`, `flushFrame()`, `requestMeasure(cb)`. В frame-режиме граф по-прежнему обновляется синхронно (`sample()` актуален), а фаза наблюдателей откладывается в один проход на кадр (rAF + фолбэк 35 мс): measures → bindings → effects. Для этого понадобился второй sentinel `POST_EFFECT`: **биндинги (`observe_`) level-triggered — одна доставка на кадр, последнее значение; эффекты (`listen`) edge-triggered — каждое событие.** Без этого разделения отложенная очередь не коалесцирует ничего (регион получил бы все промежуточные списки). Это тот же sentinel, что нужен для commit→effects (3.1) — в sync-режиме порядок пока не менялся.

Sync-режим и все 454 существующих теста не тронуты. 15 новых тестов (frp + dom).

Бенч (`benchmark/src/schedule.test.tsx`, jsdom, M-серия): пачка из N апдейтов между кадрами **без `batch()`**, каждый апдейт = счётчик + новая строка + правка строки.

| updates × rows | режим | мс   | перестроек региона | записей текста |
| -------------- | ----- | ---- | ------------------ | -------------- |
| 10 × 100       | sync  | 1.7  | 10                 | 10             |
|                | frame | 0.35 | 1                  | 1              |
| 100 × 500      | sync  | 21   | 100                | 100            |
|                | frame | 2.2  | 1                  | 1              |
| 1000 × 1000    | sync  | 420  | 1000               | 1000           |
|                | frame | 23   | 1                  | 1              |

Строки списка строятся по одному разу в обоих режимах (keyed-реюз), разница — в числе reconcile-проходов `each` и перестроек `dyn`.

**Честные оговорки.** (1) Тот же результат в sync даёт `batch()` вокруг пачки — frame-режим выигрывает только там, где пачку нельзя обернуть руками: апдейты приходят отдельными тасками (WebSocket, сеть, таймеры). Ровно сценарий tweb-a. (2) Цена: `set(); expect(dom)` → нужен `flushFrame()`; фокус/clipboard после `set()` в хендлере — тоже; `perform`-запросы уходят на кадр позже. (3) Размер: **frp +370 B** (4.13 → 4.50 kB brotli), бюджет 4.35 превышен — на спайке не ужимал.

**Решение по шагу 1 (2026-10-11), пересмотрено в тот же день: frame — единственный режим, sync удалён.** `coalesce` из спеки убран.

**Статус:** шаг 0 и шаг 1 (включая миграцию тестов, доки, changeset) сделаны. Следующий — 3.1 (в sync-порядке больше нечего упорядочивать: проход уже commit→effects; остаются `effectZone` и dev-хуки).
