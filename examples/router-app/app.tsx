// Router showcase: nested layout with <Outlet>, reactive :id params
// (no rebuild between /users/1 and /users/2 — watch the build counter),
// a lazy page in its own chunk, a guard redirect and a 404.

import { Link, Outlet, Router, lazy, useParams } from "@continuum-js/router";
import type { RouteDef } from "@continuum-js/router";

function Home() {
  return <p>Pick a page above. This is the index route.</p>;
}

let userBuilds = 0;

function User() {
  userBuilds++;
  const id = useParams().map((p) => p.id);
  const builds = userBuilds; // frozen at build time — proves reuse
  return (
    <p>
      User <b>{id}</b> (component built {String(builds)}×; switching users
      updates the text node only)
    </p>
  );
}

function UsersLayout() {
  return (
    <section>
      <nav>
        <Link href="/users/1">#1</Link>
        <Link href="/users/2">#2</Link>
        <Link href="/users/3">#3</Link>
      </nav>
      <Outlet />
    </section>
  );
}

// Code-split page: vite build emits About-[hash].js as a separate chunk,
// fetched on first visit only.
const About = lazy(() => import("./pages/about.js"), {
  fallback: () => <p>loading the about chunk…</p>,
});

const routes: RouteDef[] = [
  { path: "", component: Home },
  { path: "about", component: About },
  {
    path: "users",
    component: UsersLayout,
    children: [
      { path: "", component: () => <p>Choose a user.</p> },
      { path: ":id", component: User },
    ],
  },
  // A guard as a pure function: /admin never renders, it redirects.
  { path: "admin", component: () => <p>secret</p>, guard: () => "/about" },
];

export function App() {
  return (
    <div>
      <nav>
        <Link href="/" end>
          Home
        </Link>
        <Link href="/about">About (lazy)</Link>
        <Link href="/users">Users</Link>
        <Link href="/admin">Admin (guarded)</Link>
      </nav>
      <Router routes={routes} fallback={() => <p>404 — nothing here</p>} />
    </div>
  );
}
