# Examples

Every example is a small, complete Vite app living in
[`examples/`](https://github.com/denislibs/continuum/tree/main/examples).
Each one runs in the browser via StackBlitz — no local setup — or locally
with `npm run dev` inside the example's folder.

| Example        | What it shows                                                           | Run it                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Counter**    | The ten-line core loop: DOM event → FRP network → one patched text node | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/counter) · [source](https://github.com/denislibs/continuum/tree/main/examples/counter)       |
| **Todo**       | Keyed lists (`Each`/LIS), derived filtering, two-way input              | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/todo) · [source](https://github.com/denislibs/continuum/tree/main/examples/todo)             |
| **Data**       | `resource`: the async state machine, last-request-wins                  | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/data) · [source](https://github.com/denislibs/continuum/tree/main/examples/data)             |
| **Animation**  | Continuous time: `integral` over the rAF clock, `warp` running 2×       | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/animation) · [source](https://github.com/denislibs/continuum/tree/main/examples/animation)   |
| **Router app** | Nested routes, layouts, params-as-State, guards, `lazy` chunks          | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/router-app) · [source](https://github.com/denislibs/continuum/tree/main/examples/router-app) |
| **Showcase**   | A mixed tour of bindings, regions, and context                          | [StackBlitz](https://stackblitz.com/github/denislibs/continuum/tree/main/examples/showcase) · [source](https://github.com/denislibs/continuum/tree/main/examples/showcase)     |

::: tip How the StackBlitz links work
Opened standalone, an example installs the published `@continuum-js/*`
packages from npm. Inside the monorepo the same example resolves the
packages to their local sources — so what you see online is exactly the code
in the repository.
:::

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
