import { describe, test, expect, afterEach, beforeEach } from "vitest";
import { onCleanup } from "@continuum-js/dom";
import { render, cleanup, click, flush } from "@continuum-js/test";
import {
  Router,
  Outlet,
  Link,
  lazy,
  navigate,
  location,
  useParams,
  type RouteDef,
} from "../src/index.js";

beforeEach(() => {
  // Through navigate (not raw history.replaceState) so the location()
  // behavior and the URL stay in sync between tests.
  navigate("/", { replace: true });
});
afterEach(() => cleanup());

describe("location & navigate", () => {
  test("location() reflects the current URL as a behavior", () => {
    expect(location().sample().pathname).toBe("/");
    navigate("/about");
    expect(location().sample().pathname).toBe("/about");
    expect(window.location.pathname).toBe("/about");
  });

  test("replace navigation does not grow history", () => {
    const before = history.length;
    navigate("/a", { replace: true });
    expect(history.length).toBe(before);
  });
});

describe("Router", () => {
  const routes: RouteDef[] = [
    { path: "", component: () => <h1>Home</h1> },
    { path: "about", component: () => <h1>About</h1> },
  ];

  test("renders the matched route and switches on navigate", () => {
    const { container } = render(() => <Router routes={routes} />);
    expect(container.textContent).toBe("Home");
    navigate("/about");
    expect(container.textContent).toBe("About");
  });

  test("renders the fallback on 404", () => {
    const { container } = render(() => (
      <Router routes={routes} fallback={() => <p>lost</p>} />
    ));
    navigate("/nope");
    expect(container.textContent).toBe("lost");
  });

  test("destroys the left page (ownership cleanup runs)", () => {
    let cleaned = 0;
    const rs: RouteDef[] = [
      {
        path: "",
        component: () => {
          onCleanup(() => cleaned++);
          return <p>home</p>;
        },
      },
      { path: "about", component: () => <p>about</p> },
    ];
    render(() => <Router routes={rs} />);
    navigate("/about");
    expect(cleaned).toBe(1);
  });
});

describe("nested routes & params", () => {
  test("layout renders children through Outlet", () => {
    const routes: RouteDef[] = [
      {
        path: "users",
        component: () => (
          <section>
            <h1>Users</h1>
            <Outlet />
          </section>
        ),
        children: [
          { path: "", component: () => <p>list</p> },
          { path: ":id", component: () => <p>user</p> },
        ],
      },
    ];
    const { container } = render(() => <Router routes={routes} />);
    navigate("/users");
    expect(container.textContent).toBe("Userslist");
    navigate("/users/7");
    expect(container.textContent).toBe("Usersuser");
  });

  test("param change updates the params behavior WITHOUT rebuilding the page", () => {
    let builds = 0;
    const routes: RouteDef[] = [
      {
        path: "users",
        children: [
          {
            path: ":id",
            component: () => {
              builds++;
              const id = useParams().map((p) => p.id);
              return <p>user {id}</p>;
            },
          },
        ],
      },
    ];
    const { container } = render(() => <Router routes={routes} />);
    navigate("/users/1");
    expect(container.textContent).toBe("user 1");
    navigate("/users/2");
    expect(container.textContent).toBe("user 2");
    expect(builds).toBe(1); // fine-grained: same route def -> same subtree
  });
});

describe("Link", () => {
  const routes: RouteDef[] = [
    { path: "", component: () => <p>home</p> },
    { path: "about", component: () => <p>about</p> },
  ];

  test("navigates without page reload and marks itself active", () => {
    const { container } = render(() => (
      <div>
        <Link href="/about">go</Link>
        <Router routes={routes} />
      </div>
    ));
    const a = container.querySelector("a")!;
    expect(a.classList.contains("active")).toBe(false);
    click(a);
    expect(container.textContent).toContain("about");
    expect(window.location.pathname).toBe("/about");
    expect(a.classList.contains("active")).toBe(true);
  });
});

describe("lazy", () => {
  test("loader is not called until the route is visited; fallback shows while pending", async () => {
    let loaded = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const About = lazy(
      async () => {
        loaded++;
        await gate;
        return { default: () => <p>lazy about</p> };
      },
      { fallback: () => <p>loading…</p> },
    );
    const routes: RouteDef[] = [
      { path: "", component: () => <p>home</p> },
      { path: "about", component: About },
    ];
    const { container } = render(() => <Router routes={routes} />);
    expect(loaded).toBe(0); // not visited -> not loaded

    navigate("/about");
    expect(loaded).toBe(1);
    expect(container.textContent).toBe("loading…");

    release();
    await flush();
    expect(container.textContent).toBe("lazy about");

    // returning later reuses the cached module, no second load
    navigate("/");
    navigate("/about");
    await flush();
    expect(loaded).toBe(1);
    expect(container.textContent).toBe("lazy about");
  });
});

describe("guards", () => {
  test("a redirecting guard replaces the URL", () => {
    const routes: RouteDef[] = [
      { path: "", component: () => <p>home</p> },
      { path: "login", component: () => <p>login</p> },
      { path: "admin", component: () => <p>secret</p>, guard: () => "/login" },
    ];
    const { container } = render(() => <Router routes={routes} />);
    navigate("/admin");
    expect(container.textContent).toBe("login");
    expect(window.location.pathname).toBe("/login");
  });
});
