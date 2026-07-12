# @continuum-js/vite-plugin

Optional compiler for [Continuum](https://denislibs.github.io/continuum/): compiles JSX into cloned templates (one `cloneNode(true)` per call site instead of per-element `createElement` calls). Same semantics as the runtime JSX factory — validated by running the full dom test suite through it.

```ts
// vite.config.ts
import continuum from "@continuum-js/vite-plugin";

export default { plugins: [continuum()] };
```

Projects scaffolded with `npm create continuum-js@latest` have it enabled by default. Spread props and SVG fall back to the runtime factory automatically.

Docs: https://denislibs.github.io/continuum/guides/compiler
