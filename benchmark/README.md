# @continuum-js/benchmark

Реализация таблицы из [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark)
Стефана Краузе (keyed-вариант) на Continuum — заодно самый суровый стресс-тест
рендерера `@continuum-js/dom`.

Каждая строка — `{ id, label }`, где `label` — **отдельное поведение**, поэтому
«update every 10th row» патчит один текст-узел, не перестраивая строку. Массив
строк реконсилируется через `<Each by={id}>` (LIS-диффинг: минимум перемещений
DOM). Выделение строки — производный `class` от поведения `selected`.

## Запуск в браузере

```bash
npm run dev -w @continuum-js/benchmark   # vite dev-сервер с таблицей и кнопками
```

## Замер производительности

```bash
npx playwright install chromium   # один раз
npm run bench                      # из корня монорепо
```

`bench.mjs` собирает продакшн-бандл, поднимает `vite preview`, гоняет каждую
стандартную операцию в реальном Chromium через Playwright и печатает медиану
времени «клик → отрисованный кадр» (замер внутри страницы). Параметры:
`BENCH_REPEAT` (по умолчанию 10) и `BENCH_WARMUP` (3).

> ⚠️ Числа сравнимы только между прогонами на **одной машине**. Это не
> официальные цифры лидерборда krausest — те требуют его настроенного harness,
> прогретого браузера и фиксированного железа. Для сабмита туда приложение из
> `src/app.tsx` кладётся в `frameworks/keyed/continuum/` их репозитория и
> гоняется их раннером.

Пример вывода (headless Chromium, для калибровки — не абсолютная истина):

| operation | median ms |
|---|---|
| create rows (1k) | ~32 |
| replace all rows (1k) | ~33 |
| partial update (every 10th) | ~19 |
| select row | ~15 |
| swap rows | ~15 |
| remove row | ~15 |
| append rows (1k) | ~38 |
| create many rows (10k) | ~300 |
| clear rows (1k) | ~16 |
