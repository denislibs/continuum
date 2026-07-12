# @continuum-js/router

Client-side router for [Continuum](https://denislibs.github.io/continuum/): the current location is a `State`, route matching is a derived value, navigation is an occurrence — no effects, no re-renders.

```tsx
import { Router, Link, Outlet, lazy } from "@continuum-js/router";

const routes = [
  { path: "/", component: Home },
  { path: "/users/:id", component: lazy(() => import("./User")) },
];

mount(document.body, () => <Router routes={routes} />);
```

- Nested routes render through `<Outlet />`; params come from `useParams()` as a `State`.
- `lazy(loader, { fallback, error })` code-splits a route component.
- `location()` exposes the current URL as a `State` — derive anything from it.

Docs: https://denislibs.github.io/continuum/guides/routing
