import type { Track } from "../types";

// The Router track: URL as a first-class FRP value. `<Router>` matches the
// current location against a route table; `<Link>` navigates without a reload
// and tracks the active class; `useParams()` reads path params reactively;
// `<Outlet>` nests layouts. Every solution is verified by its check in the
// e2e run — checks click a <Link> to reach a known route, so they don't depend
// on the starting URL.

export const router: Track = {
  id: "router",
  title: "Router",
  blurb: "The URL as a value: routes, links, params, nested layouts.",
  steps: [
    {
      id: "routes",
      title: "A route table",
      task: `\`<Router routes={…} />\` matches the current URL against a list of routes
and renders the one that fits. \`<Link>\` navigates **without a reload** — it
just updates the URL value, and the matched component follows.

**Goal:** add the \`about\` route so the **About** link works.`,
      starter: `import { Router, Link } from '@continuum-js/router';

const Home = () => <p>Home page</p>;
const About = () => <p>About page</p>;

export default function App() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link> <Link href="/about">About</Link>
      </nav>
      <Router
        routes={[
          { path: '', component: Home },
          // add the about route here
        ]}
      />
    </div>
  );
}`,
      solution: `import { Router, Link } from '@continuum-js/router';

const Home = () => <p>Home page</p>;
const About = () => <p>About page</p>;

export default function App() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link> <Link href="/about">About</Link>
      </nav>
      <Router
        routes={[
          { path: '', component: Home },
          { path: 'about', component: About },
        ]}
      />
    </div>
  );
}`,
      hint: "Add { path: 'about', component: About } to the routes array. Note: no leading slash — paths are relative.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const about = [...container.querySelectorAll("a")].find(
          (a) => a.textContent === "About",
        )!;
        click(about);
        return /About page/.test(container.textContent!);
      },
    },
    {
      id: "params",
      title: "Read the params",
      task: `A \`:id\` segment captures part of the URL. \`useParams()\` gives you those
params as a **state** — so a link from \`/user/1\` to \`/user/42\` updates the id
in place, no rebuild.

**Goal:** show the id from the URL (\`user #42\`).`,
      starter: `import { Router, Link, useParams } from '@continuum-js/router';

function User() {
  // const params = useParams();
  // const id = params.map((p) => p.id);
  const id = '?';
  return <p>user #{id}</p>;
}

export default function App() {
  return (
    <div>
      <nav>
        <Link href="/user/1">one</Link> <Link href="/user/42">forty-two</Link>
      </nav>
      <Router routes={[{ path: 'user/:id', component: User }]} />
    </div>
  );
}`,
      solution: `import { Router, Link, useParams } from '@continuum-js/router';

function User() {
  const params = useParams();
  const id = params.map((p) => p.id);
  return <p>user #{id}</p>;
}

export default function App() {
  return (
    <div>
      <nav>
        <Link href="/user/1">one</Link> <Link href="/user/42">forty-two</Link>
      </nav>
      <Router routes={[{ path: 'user/:id', component: User }]} />
    </div>
  );
}`,
      hint: "const params = useParams(); then const id = params.map((p) => p.id);",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const link = [...container.querySelectorAll("a")].find(
          (a) => a.textContent === "forty-two",
        )!;
        click(link);
        return /user #42/.test(container.textContent!);
      },
    },
    {
      id: "nested",
      title: "Nested layouts",
      task: `Routes nest. A parent route is a **layout**; its children render where you
put \`<Outlet />\`. The shell stays mounted while the inner page changes.

**Goal:** drop an \`<Outlet />\` into the layout so the profile shows.`,
      starter: `import { Router, Link, Outlet } from '@continuum-js/router';

const Layout = () => (
  <section>
    <h2>Settings</h2>
    {/* the child route renders here */}
  </section>
);
const Profile = () => <p>Profile panel</p>;

export default function App() {
  return (
    <div>
      <Link href="/settings/profile">profile</Link>
      <Router
        routes={[
          {
            path: 'settings',
            component: Layout,
            children: [{ path: 'profile', component: Profile }],
          },
        ]}
      />
    </div>
  );
}`,
      solution: `import { Router, Link, Outlet } from '@continuum-js/router';

const Layout = () => (
  <section>
    <h2>Settings</h2>
    <Outlet />
  </section>
);
const Profile = () => <p>Profile panel</p>;

export default function App() {
  return (
    <div>
      <Link href="/settings/profile">profile</Link>
      <Router
        routes={[
          {
            path: 'settings',
            component: Layout,
            children: [{ path: 'profile', component: Profile }],
          },
        ]}
      />
    </div>
  );
}`,
      hint: "Put <Outlet /> inside Layout, where the child route should appear.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        click(container.querySelector("a")!);
        const text = container.textContent!;
        return /Settings/.test(text) && /Profile panel/.test(text);
      },
    },
    {
      id: "fallback",
      title: "Nothing matched",
      task: `When no route matches, \`fallback\` renders — your 404. It's just another
function returning a view.

**Goal:** show a **not found** message for unknown URLs.`,
      starter: `import { Router, Link } from '@continuum-js/router';

const Home = () => <p>home</p>;

export default function App() {
  return (
    <div>
      <Link href="/nope">broken link</Link>
      <Router
        routes={[{ path: '', component: Home }]}
        // add a fallback for unmatched URLs
      />
    </div>
  );
}`,
      solution: `import { Router, Link } from '@continuum-js/router';

const Home = () => <p>home</p>;

export default function App() {
  return (
    <div>
      <Link href="/nope">broken link</Link>
      <Router
        routes={[{ path: '', component: Home }]}
        fallback={() => <p>404 — not found</p>}
      />
    </div>
  );
}`,
      hint: "Pass fallback={() => <p>404 — not found</p>} to <Router>.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        click(container.querySelector("a")!);
        return /not found/i.test(container.textContent!);
      },
    },
  ],
};
