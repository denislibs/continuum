# Continuum

[![CI](https://github.com/denislibs/continuum/actions/workflows/ci.yml/badge.svg)](https://github.com/denislibs/continuum/actions/workflows/ci.yml)

Реактивный фреймворк на **классическом FRP** (Behaviors + Events) с fine-grained
рендерингом. Дискретная ветвь традиции Эллиотта в стиле Sodium: транзакции,
ранговая протяжка, задержка `hold` на границе момента.

Ключевое решение: `Behavior` — это **значение**, а не функция чтения. Поэтому
реактивную величину передают как объект (`<div>{count}</div>`), и рендереру не
нужен билд-тайм-трансформ.

> 📖 Концептуальное описание модели — от философии до алгебры и следствий —
> в [PHILOSOPHY.md](PHILOSOPHY.md).

## Монорепозиторий

```
continuum/
├─ packages/
│  ├─ frp/        @continuum/frp   — ядро: Event, Behavior, планировщик
│  └─ dom/        @continuum/dom   — рендерер: h, dyn, each, владение, контекст
├─ examples/                       — запускаемые примеры (Vite), каждый — отдельно
│  ├─ counter/    @continuum/example-counter    — счётчик из §1.1 + тест
│  ├─ todo/       @continuum/example-todo        — <Show>/<Each> + bindInput + тест
│  ├─ animation/  @continuum/example-animation   — integral + time warp (непрерывное время)
│  └─ showcase/   @continuum/example-showcase    — <Dynamic> (табы) + <Show>/<Portal> (модалка)
├─ vitest.config.ts   — общий раннер (jsdom, automatic JSX), алиасы на исходники
├─ tsconfig.json      — solution-style, project references
└─ tsconfig.base.json — общие compilerOptions
```

Зависимость строго односторонняя: `dom` → `frp`; `frp` самодостаточен. Примеры
живут в корневом `examples/` и потребляют пакеты как `@continuum/frp` / `@continuum/dom`.

## Быстрый старт

```bash
npm install
npm test              # vitest run — 69 тестов
npm run typecheck     # tsc -b по всем пакетам
npm run example:counter  # vite dev-сервер для examples/counter
npm run example:todo     # vite dev-сервер для examples/todo
npm run example:showcase # <Dynamic>/<Show>/<Portal> демо
```

### Счётчик за 10 строк (`examples/counter`)

```tsx
import { newEvent } from "@continuum/frp";

export function Counter() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}
```

Компонент выполняется **один раз**. Клик уходит в FRP-сеть, `accum` обновляет
поведение, патчится ровно один текст-узел — без VDOM и диффинга.

> JSX работает через **автоматический рантайм** — `import { h }` в компонентах
> не нужен. Настройка: `"jsx": "react-jsx"`, `"jsxImportSource": "@continuum/dom"`
> (для Vite/esbuild — `jsx: "automatic"`). `h` остаётся доступным экспортом для
> явных вызовов.

## Что реализовано

**Ядро (`@continuum/frp`).** Транзакции (фазы prioritized/last/post), min-куча
рангов и glitch-free протяжка, коалесинг одновременных происшествий, задержка
`hold`. Комбинаторы: `map`, `mapTo`, `filter`, `gate`, `snapshot`, `merge`,
`orElse`, `accum`/`accumE`, `hold`, `once`, `listen`; для поведений — `map`,
`apply`, `lift2`/`lift3`, `switchB`/`switchE`, `fromPoll`, `time`, `listen`.
Из дорожной карты: `distinct`, `perform` (граница IO с `Result`), изоляция
ошибок в фазе post и «атомарный или отброшенный момент» через стейджинг по
идентичности транзакции; **устойчивые ранги** (`ensureBiggerThan` + обнаружение
циклов) для корректного `switch` в плотных графах; **непрерывное время** —
`integral`/`derivative`/`warp` (численно семплируемые по дискретному клоку);
**явный `dispose`** у `Event`/`Behavior` с каскадом вверх по неиспользуемым
производным узлам (для долгоживущих не-UI графов).

**Рендерер (`@continuum/dom`).** JSX-фабрика `h`/`Fragment`, точечные привязки
текста/атрибутов/свойств, события `on*`, `dyn`, `each` (keyed-реконсиляция с
LIS-диффингом и сохранением фокуса), дерево владения `root`/`scope`/`onCleanup`
с каскадной очисткой подписок, контекст `createContext`/`provide`/`use`, хелперы
`when`/`bindInput`/`portal`, компоненты-обёртки `<Show>`/`<Each>`/`<Dynamic>`/
`<Portal>`, `animationFrames` (клок кадров для непрерывного времени),
SVG-неймспейсы (`<svg>`-поддеревья через `createElementNS`), `mount`.

## Непрерывное время

`integral`/`derivative`/`warp` из ядра работают поверх дискретного клока
(`Event<number>` временных меток) — в браузере его даёт `animationFrames()`.
Реализация численная (forward Euler / конечные разности), детерминированная и не
зависит от числа наблюдателей: аккумуляция происходит один раз на тик. Денотация
разрешение-независима, семплированный результат её приближает. Демо —
[`examples/animation`](examples/animation) (`npm run example:animation`).

## Ограничения (см. дорожную карту §14 спецификации)

- **Непрерывное время** реализовано *численно* через семплирование по клоку, а
  не как первоклассная величина `Time = ℝ` в духе чистого Конала: точность
  зависит от частоты клока, `warp` применяется к меткам тиков (см.
  [PHILOSOPHY.md](PHILOSOPHY.md)).
- **Ссылочная модель памяти** без слабых ссылок: подписка идёт от источника к
  потребителю, поэтому производные узлы живут, пока жив источник. Явный
  `dispose()` (с каскадом вверх по неиспользуемым производным) позволяет
  разорвать цепочку вручную; в UI это делает дерево владения слоя `dom`.
