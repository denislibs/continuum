# @continuum-js/dom

[Русская версия](./README.ru.md)

A thin fine-grained renderer on top of [`@continuum-js/frp`](../frp). Maps
`State`/`Stream` onto real DOM nodes with pinpoint updates; works with plain
JSX via the **automatic runtime** (no `import { h }` needed).

```tsx
import { state } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";

const name = state("world");
mount(document.body, () => <h1>hello {name}</h1>);
name.set("continuum"); // a single text node is patched
```

- **`h` / `Fragment`** — the JSX factory; a component is called once. `State`
  in children → a live text node; `State` in props → a live attribute/property;
  `on*` → a DOM listener.
- **`dyn(b, render)`** — a conditional/switchable subtree.
- **`each(items, key, render)`** — a keyed list with LIS diffing and focus
  preservation.
- **Ownership tree** — `root` / `scope` / `onCleanup`: cascading cleanup of
  subscriptions when dynamic regions are torn down.
- **Context** — `createContext` / `provide` / `use` on top of the ownership
  tree.
- **Helpers** — `when`, `bindInput`, `portal`, `mount`, `animationFrames`.
- **SVG** — `<svg>`, `<rect>`, `<path>`, `<circle>`, … tags are created in the
  SVG namespace (`createElementNS`); `class` and attributes (`viewBox`, `fill`,
  …) are set correctly. HTML inside `<foreignObject>` stays HTML.
- **Wrapper components** — JSX over the helpers (Solid-style):

```tsx
<Show when={user} fallback={() => <Guest />}>
  {(u) => <span>{u.name}</span>}
</Show>

<Each each={items} by={(i) => i.id}>
  {(item) => <li>{item.name}</li>}
</Each>

<Dynamic value={route}>{(r) => (r === "home" ? <Home /> : <About />)}</Dynamic>

<Portal mount={document.body}><Modal /></Portal>
```

### JSX setup (automatic runtime)

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@continuum-js/dom",
  },
}
```

For Vite/esbuild — `jsx: "automatic"`, `jsxImportSource: "@continuum-js/dom"`.
The classic factory is also supported (`h`/`Fragment` are exported) — then use
`--jsx react --jsxFactory h --jsxFragmentFactory Fragment` and `import { h }`
in every file with JSX.
