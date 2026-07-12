# Примеры

Каждый пример — маленькое законченное Vite-приложение в
[`examples/`](https://github.com/denislibs/continuum/tree/main/examples).
Любой запускается в браузере через StackBlitz — без локальной настройки —
или локально через `npm run dev` в папке примера.

| Пример         | Что показывает                                                               | Запустить                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Counter**    | Ядро в десять строк: DOM-событие → FRP-сеть → один патчащийся текстовый узел | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/counter) · [код](https://github.com/denislibs/continuum/tree/main/examples/counter)       |
| **Todo**       | Списки по ключу (`Each`/LIS), производная фильтрация, двусторонний ввод      | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/todo) · [код](https://github.com/denislibs/continuum/tree/main/examples/todo)             |
| **Data**       | `resource`: асинхронный автомат состояний, last-request-wins                 | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/data) · [код](https://github.com/denislibs/continuum/tree/main/examples/data)             |
| **Animation**  | Непрерывное время: `integral` над rAF-часами, `warp` со скоростью 2×         | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/animation) · [код](https://github.com/denislibs/continuum/tree/main/examples/animation)   |
| **Router app** | Вложенные роуты, layouts, параметры-State, guards, `lazy`-чанки              | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/router-app) · [код](https://github.com/denislibs/continuum/tree/main/examples/router-app) |
| **Showcase**   | Смешанная экскурсия: привязки, регионы, контекст                             | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/showcase) · [код](https://github.com/denislibs/continuum/tree/main/examples/showcase)     |

::: tip Как работают ссылки StackBlitz
Открытый отдельно, пример ставит опубликованные пакеты `@continuum-js/*` из
npm. Внутри монорепо тот же пример резолвит пакеты в локальные исходники —
так что онлайн вы видите ровно тот код, что лежит в репозитории.
:::

---

> Незнакомый термин? Вся терминология этой документации объяснена в [глоссарии](/ru/glossary).
