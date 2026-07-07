# Context

::: tip In plain words
How to hand a value to all descendants without threading it through every prop.
:::

Context passes values down the tree without threading them through every
prop. In Continuum it lives on the **ownership tree**: `provide` writes into
the current owner, `use` looks up through ancestors.

```tsx
import { createContext, provide, use } from "@continuum-js/dom";

const Theme = createContext("light"); // default value

function App() {
  provide(Theme, "dark"); // writes into the current owner
  return <Toolbar />;
}

function Toolbar() {
  const theme = use(Theme); // finds the nearest provided value
  return <div class={theme}>…</div>;
}
```

There is no `<Provider>` wrapper component — providing is a statement, not
structure. A `provide` inside a `dyn`/`Show`/`Each` subtree is scoped to
that subtree and disappears with it.

## Reactive context

The context value itself is plain (looked up once, at build time). For a
value that changes, put a **Behavior** in the context:

```tsx
const Theme = createContext<Behavior<string>>(constant("light"));

function App() {
  const [theme, setTheme] = newBehavior("dark");
  provide(Theme, theme);
  return <Toolbar />;
}

function Toolbar() {
  return <div class={use(Theme)}>…</div>; // a live binding
}
```

No "re-render on context change" exists or is needed: consumers bind to the
Behavior once.

## Rule of thumb

`use` reads the context of the place where it is _called_ — call it in the
component body (during build), not inside event handlers or async callbacks.

The router is built on exactly this mechanism: `<Outlet>` and `useParams()`
read a `RouterContext` carrying the matched chain and the current depth —
see [Routing](/guides/routing).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
