import { describe, test, expect } from "vitest";
import { mount, dyn } from "@continuum-js/dom";
import { newBehavior } from "@continuum-js/frp";

describe("dyn under re-entrant moments", () => {
  test("a stale queued update cannot overwrite a newer render", () => {
    const [n, setN] = newBehavior(0);

    // A listener registered BEFORE dyn subscribes: in the post phase it runs
    // first and re-enters with a new moment (like a router redirect guard).
    n.updates.listen((v) => {
      if (v === 1) setN(2);
    });

    const container = document.createElement("div");
    mount(container, () => dyn(n, (v) => <p>{String(v)}</p>) as Node);
    expect(container.textContent).toBe("0");

    setN(1); // handler above immediately renavigates to 2
    // The stale "1" delivery must not clobber the "2" render.
    expect(container.textContent).toBe("2");
  });

  test("duplicate deliveries of the same value do not rebuild", () => {
    const [n, setN] = newBehavior(0);
    let builds = 0;
    const container = document.createElement("div");
    mount(
      container,
      () =>
        dyn(n, (v) => {
          builds++;
          return <p>{String(v)}</p>;
        }) as Node,
    );
    expect(builds).toBe(1);
    setN(1);
    expect(builds).toBe(2);
    setN(1); // same value again — a rebuild would lose subtree state
    expect(builds).toBe(2);
  });
});

describe("dyn region removal", () => {
  test("outer rebuild removes nodes a nested root-level dyn swapped in", () => {
    const [inner, setInner] = newBehavior("a");
    const [outer, setOuter] = newBehavior(true);

    const container = document.createElement("div");
    mount(
      container,
      () =>
        dyn(outer, (on) =>
          // the component's ROOT is itself a dynamic region (like a lazy page)
          on ? dyn(inner, (v) => <p>{v}</p>) : <span>off</span>,
        ) as Node,
    );
    expect(container.textContent).toBe("a");

    setInner("b"); // nested region replaces its nodes
    expect(container.textContent).toBe("b");

    setOuter(false); // outer rebuild must sweep EVERYTHING between its markers
    expect(container.textContent).toBe("off");
  });
});
