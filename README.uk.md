# Continuum

[English](README.md) | [Русский](README.ru.md) | **Українська**

[![CI](https://github.com/denislibs/continuum/actions/workflows/ci.yml/badge.svg)](https://github.com/denislibs/continuum/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40continuum-js%2Fdom?label=npm%20%40continuum-js%2Fdom)](https://www.npmjs.com/package/@continuum-js/dom)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40continuum-js%2Fdom?label=dom%20minzip)](https://bundlephobia.com/package/@continuum-js/dom)
[![docs](https://img.shields.io/badge/docs-denislibs.github.io-blue)](https://denislibs.github.io/continuum/)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Реактивний фреймворк на **класичному FRP** (Behaviors + Events) з fine-grained
рендерингом. Дискретна гілка традиції Елліотта в стилі Sodium: транзакції,
рангове поширення, затримка `hold` на межі моменту.

Ключове рішення: `Behavior` — це **значення**, а не функція читання. Тому
реактивну величину передають як об'єкт (`<div>{count}</div>`), і рендереру не
потрібен build-time-трансформ.

**Легкий по-чесному:** цілий застосунок — фреймворк, стан, рендерер _і код
самого застосунку_ — збирається у **3,7 кБ gzip** JavaScript (увесь бандл
`examples/counter`). Самі React + ReactDOM важать у ~12 разів більше — ще до
стейт-менеджера.

> 📖 Концептуальний опис моделі — від філософії до алгебри та наслідків —
> у [PHILOSOPHY.md](PHILOSOPHY.md) (російською).
>
> ⚙️ Операційний бік тієї ж моделі — транзакції, затримка `hold`, ранги,
> `switch`, з посиланнями на книгу Blackheath & Jones «Functional Reactive
> Programming» (Manning) — у [FRP-MODEL.md](FRP-MODEL.md) (російською).
>
> ⚛️ Той самий код на React і на Continuum, поруч — у [FROM-REACT.md](FROM-REACT.md) (російською).
>
> 🗺️ План розвитку за віхами (публікація → роутер → доки → стійкість →
> екосистема) — у [ROADMAP.md](ROADMAP.md) (російською).

## Монорепозиторій

```
continuum/
├─ packages/
│  ├─ frp/        @continuum-js/frp   — ядро: Event, Behavior, планувальник
│  ├─ dom/        @continuum-js/dom   — рендерер: h, dyn, each, володіння, контекст
│  ├─ std/        @continuum-js/std   — комбінатори: resource, debounce, throttle, …
│  ├─ router/     @continuum-js/router — URL як Behavior: вкладені маршрути, ліниві сторінки
│  └─ test/       @continuum-js/test  — тест-утиліти: render, fire, flush
├─ examples/                       — приклади, що запускаються (Vite), кожен окремо
│  ├─ counter/    @continuum-js/example-counter    — лічильник із §1.1 + тест
│  ├─ todo/       @continuum-js/example-todo        — <Show>/<Each> + bindInput + тест
│  ├─ animation/  @continuum-js/example-animation   — integral + time warp (неперервний час)
│  ├─ showcase/   @continuum-js/example-showcase    — <Dynamic> (вкладки) + <Show>/<Portal> (модалка)
│  └─ data/       @continuum-js/example-data        — HTTP-запити: perform/Result + debounce + resource
│  └─ router-app/ @continuum-js/example-router-app — вкладений layout, лінивий чанк, guard, 404
├─ benchmark/     @continuum-js/benchmark           — таблиця js-framework-benchmark + замір Playwright
├─ .size-limit.json   — бюджети розміру бандла (npm run size)
├─ vitest.config.ts   — спільний раннер (jsdom, automatic JSX), аліаси на джерела
├─ tsconfig.json      — solution-style, project references
└─ tsconfig.base.json — спільні compilerOptions
```

Залежності строго односторонні: `dom` → `frp`, `std` → `frp`; `frp`
самодостатній. Приклади живуть у кореневому `examples/` і споживають пакети як
`@continuum-js/frp` / `@continuum-js/dom` / `@continuum-js/std`.

## Швидкий старт

Новий проєкт (Vite + TypeScript + лічильник + тест):

```bash
npm create continuum-js@latest my-app
cd my-app && npm install && npm run dev
```

Розробка самого фреймворку:

```bash
npm install
npm test              # vitest run
npm run typecheck     # tsc -b по всіх пакетах
npm run example:counter  # vite dev-сервер для examples/counter
npm run example:todo     # vite dev-сервер для examples/todo
npm run example:showcase # <Dynamic>/<Show>/<Portal> демо
npm run example:data     # живий пошук: fetch через perform/Result + debounce
npm run example:router   # роутер: вкладений layout, лінивий чанк, guard, 404
npm run size             # size-limit: gzip/brotli-розмір пакетів
npm run bench            # Playwright-замір таблиці js-framework-benchmark
npm run build            # збірка dist/ (ESM + .d.ts) усіх публікованих пакетів
npm run smoke            # контракт публікації: pack → npm i в чистий Vite-проєкт → tsc + vite build
```

Розмір (brotli, із залежностями): `@continuum-js/frp` ≈ **1.8 kB**,
`@continuum-js/dom` (разом із frp) ≈ **3.5 kB**, `@continuum-js/std` (разом із
frp) ≈ **2.0 kB**. Бюджети — у [`.size-limit.json`](.size-limit.json),
`npm run size` падає при перевищенні. Замір продуктивності —
див. [`benchmark/`](benchmark) (`npm run bench`, потрібен
`npx playwright install chromium`).

### Лічильник за 10 рядків (`examples/counter`)

```tsx
import { newEvent } from "@continuum-js/frp";

export function Counter() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}
```

Компонент виконується **один раз**. Клік іде у FRP-мережу, `accum` оновлює
поведінку, патчиться рівно один текстовий вузол — без VDOM і дифінгу.

> JSX працює через **автоматичний рантайм** — `import { h }` у компонентах
> не потрібен. Налаштування: `"jsx": "react-jsx"`,
> `"jsxImportSource": "@continuum-js/dom"` (для Vite/esbuild —
> `jsx: "automatic"`). `h` залишається доступним експортом для явних викликів.

## Що реалізовано

**Ядро (`@continuum-js/frp`).** Транзакції (фази prioritized/last/post),
min-купа рангів і glitch-free поширення, коалесинг одночасних подій, затримка
`hold`. Комбінатори: `map`, `mapTo`, `filter`, `gate`, `snapshot`, `merge`,
`orElse`, `accum`/`accumE`, `hold`, `once`, `listen`; для поведінок — `map`,
`apply`, `lift2`/`lift3`, `switchB`/`switchE`, `fromPoll`, `time`, `listen`.
З дорожньої карти: `distinct`, `perform` (межа IO з `Result`), ізоляція
помилок у фазі post і «атомарний або відкинутий момент» через стейджинг за
ідентичністю транзакції; **стійкі ранги** (`ensureBiggerThan` + виявлення
циклів) для коректного `switch` у щільних графах; **неперервний час** —
`integral`/`derivative`/`warp` (чисельно семпльовані за дискретним клоком);
**явний `dispose`** в `Event`/`Behavior` з каскадом угору по невикористаних
похідних вузлах (для довгоживучих не-UI графів).

**Рендерер (`@continuum-js/dom`).** JSX-фабрика `h`/`Fragment`, точкові
прив'язки тексту/атрибутів/властивостей, події `on*`, `dyn`, `each`
(keyed-реконсиляція з LIS-дифінгом і збереженням фокуса), дерево володіння
`root`/`scope`/`onCleanup` з каскадним очищенням підписок, контекст
`createContext`/`provide`/`use`, хелпери `when`/`bindInput`/`portal`,
компоненти-обгортки `<Show>`/`<Each>`/`<Dynamic>`/`<Portal>`,
`animationFrames` (клок кадрів для неперервного часу), SVG-неймспейси
(`<svg>`-піддерева через `createElementNS`), `mount`.

## Неперервний час

`integral`/`derivative`/`warp` з ядра працюють поверх дискретного клока
(`Event<number>` часових міток) — у браузері його дає `animationFrames()`.
Реалізація чисельна (forward Euler / скінченні різниці), детермінована і не
залежить від кількості спостерігачів: акумуляція відбувається один раз на тік.
Денотація незалежна від роздільності, семпльований результат її наближає.
Демо — [`examples/animation`](examples/animation)
(`npm run example:animation`).

## Робота з даними (HTTP)

IO живе на **межі** мережі. `perform` приймає `Event` запитів, запускає
асинхронний ефект у фазі post (після закриття моменту) і повертає результат
новою подією — вже як дані, з помилкою, загорнутою в `Result`, а не кинутою.
Поверх цього [`@continuum-js/std`](packages/std) дає готові перевикористовувані
цеглинки (а [`examples/data`](examples/data) показує їх у ділі):

- `resource(trigger, fetcher): Behavior<Async<T>>` — скінченний автомат
  `idle → loading → ok | error`. Запити нумеруються, тому запізніла відповідь
  на застарілий запит відкидається (last-request-wins) — декларативне рішення
  класичного бага гонки відповідей.
- `debounce(event, ms)` — коалесинг сплеску в останнє значення після паузи.

Разом вони дають живий пошук «під час введення»: `input → debounce → fetch →
loading/error/empty/results`. Фетчер інжектується, тому компонент тестується
без мережі (`npm run example:data` б'є в реальний GitHub API).

## Обмеження (див. дорожню карту §14 специфікації)

- **Неперервний час** реалізовано _чисельно_ через семплювання за клоком, а не
  як першокласну величину `Time = ℝ` в дусі чистого Конала: точність залежить
  від частоти клока, `warp` застосовується до міток тіків (див.
  [PHILOSOPHY.md](PHILOSOPHY.md)).
- **Посилальна модель пам'яті** без слабких посилань: підписка йде від джерела
  до споживача, тому похідні вузли живуть, доки живе джерело. Явний
  `dispose()` (з каскадом угору по невикористаних похідних) дозволяє розірвати
  ланцюжок вручну; в UI це робить дерево володіння шару `dom`.
