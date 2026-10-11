import { describe, test, expect } from "vitest";
import { mount, dyn, each, onCleanup } from "@continuum-js/dom";
import { state } from "@continuum-js/frp";
import { flushFrame } from "@continuum-js/frp";

describe("dyn", () => {
  test("swaps the subtree when the behavior changes", () => {
    const b = state("a");
    const set = b.set;
    const container = document.createElement("div");
    mount(container, () => dyn(b, (v) => <span>{v}</span>));
    flushFrame();
    expect(container.textContent).toBe("a");
    set("b");
    flushFrame();
    expect(container.textContent).toBe("b");
  });

  test("disposes the old subtree's cleanups on switch", () => {
    const b = state("a");
    const set = b.set;
    const log: string[] = [];
    const container = document.createElement("div");
    mount(container, () =>
      dyn(b, (v) => {
        onCleanup(() => log.push("cleanup-" + v));
        return <span>{v}</span>;
      }),
    );
    flushFrame();
    expect(log).toEqual([]);
    set("b");
    flushFrame();
    expect(log).toEqual(["cleanup-a"]);
    set("c");
    flushFrame();
    expect(log).toEqual(["cleanup-a", "cleanup-b"]);
  });

  test("unmount disposes the active subtree", () => {
    const b = state("a");
    const log: string[] = [];
    const container = document.createElement("div");
    const unmount = mount(container, () =>
      dyn(b, (v) => {
        onCleanup(() => log.push("cleanup-" + v));
        return <span>{v}</span>;
      }),
    );
    unmount();
    flushFrame();
    expect(log).toEqual(["cleanup-a"]);
  });
});

describe("each", () => {
  test("renders a keyed list", () => {
    const items = state([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const container = document.createElement("div");
    mount(container, () =>
      each(
        items,
        (i) => i.id,
        (i) => <li>{String(i.id)}</li>,
      ),
    );
    flushFrame();
    expect(container.querySelectorAll("li").length).toBe(3);
    flushFrame();
    expect(container.textContent).toBe("123");
  });

  test("adds and removes keys", () => {
    const items = state([{ id: 1 }, { id: 2 }]);
    const setItems = items.set;
    const container = document.createElement("div");
    mount(container, () =>
      each(
        items,
        (i) => i.id,
        (i) => <li>{String(i.id)}</li>,
      ),
    );
    flushFrame();
    expect(container.textContent).toBe("12");
    setItems([{ id: 1 }, { id: 2 }, { id: 3 }]);
    flushFrame();
    expect(container.textContent).toBe("123");
    setItems([{ id: 2 }]);
    flushFrame();
    expect(container.textContent).toBe("2");
  });

  test("reuses DOM nodes for kept keys across reorder", () => {
    const items = state([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const setItems = items.set;
    const container = document.createElement("div");
    mount(container, () =>
      each(
        items,
        (i) => i.id,
        (i) => <li id={"row" + i.id}>{String(i.id)}</li>,
      ),
    );
    const row2before = container.querySelector("#row2");
    setItems([{ id: 3 }, { id: 2 }, { id: 1 }]);
    const row2after = container.querySelector("#row2");
    flushFrame();
    expect(row2after).toBe(row2before); // same node, not rebuilt
    flushFrame();
    expect(container.textContent).toBe("321");
  });

  test("renders each row's content only once (no re-render on reorder)", () => {
    let renders = 0;
    const items = state([{ id: 1 }, { id: 2 }]);
    const setItems = items.set;
    const container = document.createElement("div");
    mount(container, () =>
      each(
        items,
        (i) => i.id,
        (i) => {
          renders++;
          return <li>{String(i.id)}</li>;
        },
      ),
    );
    flushFrame();
    expect(renders).toBe(2);
    setItems([{ id: 2 }, { id: 1 }]); // reorder only
    flushFrame();
    expect(renders).toBe(2); // no new renders
    setItems([{ id: 2 }, { id: 1 }, { id: 3 }]); // one new key
    flushFrame();
    expect(renders).toBe(3);
  });

  test("disposes cleanups of removed rows", () => {
    const log: string[] = [];
    const items = state([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const setItems = items.set;
    const container = document.createElement("div");
    mount(container, () =>
      each(
        items,
        (i) => i.id,
        (i) => {
          onCleanup(() => log.push("rm" + i.id));
          return <li>{String(i.id)}</li>;
        },
      ),
    );
    setItems([{ id: 1 }, { id: 3 }]); // remove 2
    flushFrame();
    expect(log).toEqual(["rm2"]);
    setItems([]); // remove rest
    flushFrame();
    expect(log.sort()).toEqual(["rm1", "rm2", "rm3"]);
  });
});
