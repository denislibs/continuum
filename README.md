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
│  ├─ counter/    @continuum/example-counter — счётчик из §1.1 + тест
│  └─ todo/       @continuum/example-todo     — keyed-список (each/when/bindInput) + тест
├─ vitest.config.ts   — общий раннер (jsdom, jsxFactory h), алиасы на исходники
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
```

### Счётчик за 10 строк (`examples/counter`)

```tsx
import { newEvent } from "@continuum/frp";
import { h } from "@continuum/dom";

export function Counter() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}
```

Компонент выполняется **один раз**. Клик уходит в FRP-сеть, `accum` обновляет
поведение, патчится ровно один текст-узел — без VDOM и диффинга.

## Что реализовано

**Ядро (`@continuum/frp`).** Транзакции (фазы prioritized/last/post), min-куча
рангов и glitch-free протяжка, коалесинг одновременных происшествий, задержка
`hold`. Комбинаторы: `map`, `mapTo`, `filter`, `gate`, `snapshot`, `merge`,
`orElse`, `accum`/`accumE`, `hold`, `once`, `listen`; для поведений — `map`,
`apply`, `lift2`/`lift3`, `switchB`/`switchE`, `fromPoll`, `time`, `listen`.
Из дорожной карты: `distinct`, `perform` (граница IO с `Result`), изоляция
ошибок в фазе post и «атомарный или отброшенный момент» через стейджинг по
идентичности транзакции.

**Рендерер (`@continuum/dom`).** JSX-фабрика `h`/`Fragment`, точечные привязки
текста/атрибутов/свойств, события `on*`, `dyn`, `each` (keyed-реконсиляция с
LIS-диффингом и сохранением фокуса), дерево владения `root`/`scope`/`onCleanup`
с каскадной очисткой подписок, контекст `createContext`/`provide`/`use`, хелперы
`when`/`bindInput`/`portal`, `mount`.

## Ограничения (см. дорожную карту §14 спецификации)

- **Ранги при `switch`** только повышаются (`ensureBiggerThan` и обнаружение
  циклов — не реализованы). В плотных графах с частым переключением возможны
  краевые случаи упорядочивания.
- **Непрерывное время** доступно только семплированием (`fromPoll`, `time`).
  Первоклассных `integral`/`derivative`/time-warping нет — это осознанно
  отложенный, самый спекулятивный пункт дорожной карты.
