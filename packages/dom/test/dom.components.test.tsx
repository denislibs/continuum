import { describe, test, expect } from "vitest";
import {
  mount,
  Show,
  Each,
  Dynamic,
  Portal,
  dyn,
  each,
  portal,
} from "@continuum-js/dom";
import { state } from "@continuum-js/frp";
import { flushFrame } from "@continuum-js/frp";

describe("<Show>", () => {
  test("renders children when truthy, fallback when falsy, and toggles", () => {
    const user = state<{ name: string } | null>(null);
    const setUser = user.set;
    const container = document.createElement("div");
    mount(container, () => (
      <Show when={user} fallback={() => <p class="empty">none</p>}>
        {(u) => <span>{u.name}</span>}
      </Show>
    ));
    flushFrame();
    expect(container.querySelector(".empty")).not.toBeNull();
    setUser({ name: "Ann" });
    flushFrame();
    expect(container.textContent).toBe("Ann");
    flushFrame();
    expect(container.querySelector(".empty")).toBeNull();
    setUser(null);
    flushFrame();
    expect(container.querySelector(".empty")).not.toBeNull();
  });

  test("does not rebuild while the condition stays truthy", () => {
    const flag = state(true);
    const setFlag = flag.set;
    let builds = 0;
    const container = document.createElement("div");
    mount(container, () => (
      <Show when={flag}>
        {() => {
          builds++;
          return <span>on</span>;
        }}
      </Show>
    ));
    flushFrame();
    expect(builds).toBe(1);
    setFlag(true); // same truthiness
    flushFrame();
    expect(builds).toBe(1);
  });
});

describe("<Each>", () => {
  test("renders a keyed list and reuses nodes on reorder", () => {
    const items = state([
      { id: 1, t: "a" },
      { id: 2, t: "b" },
    ]);
    const setItems = items.set;
    const container = document.createElement("div");
    mount(container, () => (
      <Each each={items} by={(i) => i.id}>
        {(item) => <li id={"row" + item.id}>{item.t}</li>}
      </Each>
    ));
    flushFrame();
    expect(container.textContent).toBe("ab");
    const row1 = container.querySelector("#row1");
    setItems([
      { id: 2, t: "b" },
      { id: 1, t: "a" },
    ]);
    flushFrame();
    expect(container.textContent).toBe("ba");
    flushFrame();
    expect(container.querySelector("#row1")).toBe(row1); // reused
  });
});

describe("<Dynamic>", () => {
  test("swaps the subtree when the value changes", () => {
    const tab = state("home");
    const setTab = tab.set;
    const container = document.createElement("div");
    mount(container, () => (
      <Dynamic value={tab}>
        {(t) => (t === "home" ? <span>H</span> : <span>A</span>)}
      </Dynamic>
    ));
    flushFrame();
    expect(container.textContent).toBe("H");
    setTab("about");
    flushFrame();
    expect(container.textContent).toBe("A");
  });
});

describe("<Portal>", () => {
  test("renders children into another node", () => {
    const target = document.createElement("div");
    const container = document.createElement("div");
    const unmount = mount(container, () => (
      <Portal mount={target}>
        <span>hi</span>
      </Portal>
    ));
    flushFrame();
    expect(target.textContent).toBe("hi");
    flushFrame();
    expect(container.textContent).toBe("");
    unmount();
    flushFrame();
    expect(target.textContent).toBe("");
  });
});

describe("dynamic regions demand an owner — with a teaching error", () => {
  test("dyn/each/portal outside any owner explain themselves", () => {
    const b = state(0);
    flushFrame();
    expect(() => dyn(b, (v) => String(v))).toThrow(/needs an owner/);
    flushFrame();
    expect(() =>
      each(
        b.map((v) => [v]),
        (x) => x,
        (x) => String(x),
      ),
    ).toThrow(/needs an owner/);
    flushFrame();
    expect(() => portal(document.createElement("div"), "hi")).toThrow(
      /needs an owner/,
    );
  });
});
