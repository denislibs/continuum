# Routing

`@continuum-js/router` treats the URL as what it is in this model: a
**Behavior**. A route change is a change of a dynamic region; leaving a page
disposes its subtree through the ownership tree.

## Routes

```tsx
import {
  Router,
  Outlet,
  Link,
  lazy,
  type RouteDef,
} from "@continuum-js/router";

const routes: RouteDef[] = [
  {
    path: "",
    component: Layout, // renders <Outlet /> for children
    children: [
      { path: "", component: Home },
      { path: "users/:id", component: UserPage },
      {
        path: "admin",
        guard: (params) => isAdmin() || "/login",
        component: AdminPage,
      },
      { path: "*", component: NotFound },
    ],
  },
];

<Router routes={routes} fallback={() => <NotFound />} />;
```

- `:id` becomes `params.id`; `*` catches the rest as `params["*"]`;
- a route without `component` is a pathless layout — children render
  through;
- `fallback` renders when nothing matches at all.

## Nesting: `<Outlet>`

A layout renders its matched child with `<Outlet />`:

```tsx
function Layout() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/users/1">User 1</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

`<Link>` intercepts plain left clicks into client-side navigation and
carries an `active` class (exact match for `/`, prefix otherwise; `end`
forces exact; `activeClass` overrides the name).

## Params are a Behavior

```tsx
import { useParams } from "@continuum-js/router";

function UserPage() {
  const params = useParams(); // Behavior<Params>, own + ancestors'
  const user = resource(
    params.map((p) => p.id).updates,
    (id) => api.fetchUser(id),
  );
  return …;
}
```

The region is keyed by **route identity**, not URL: navigating
`/users/1 → /users/2` does not rebuild `UserPage` — only the `params`
behavior updates. The fine-grained promise, applied to routing.

## Guards

A guard is a pure function of the params: return `true` to pass or a path to
redirect to. Redirects are applied as _replace_ navigation, so the guarded
URL doesn't pollute history.

## Code splitting

`lazy` takes a thunk with a **literal** `import()` — that literal is what
makes the bundler emit a separate chunk:

```tsx
const About = lazy(() => import("./pages/About.js"), {
  fallback: () => <p>loading…</p>,
  error: (e) => <p>failed to load</p>,
});
```

The loader runs on first visit and is cached forever after. Pending and
error states are ordinary values rendered by the region — no Suspense
mechanism.

## Programmatic navigation

```ts
import { location, navigate } from "@continuum-js/router";

navigate("/users/2"); // pushState
navigate("/login", { replace: true }); // replaceState
const url = location(); // Behavior<URL> — the singleton
```

`location()` also follows back/forward buttons (popstate). Deriving from it
is ordinary FRP: `location().map((u) => u.searchParams.get("q"))`.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
