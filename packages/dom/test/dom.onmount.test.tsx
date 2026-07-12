import { describe, test, expect, afterEach } from "vitest";
import { mount, dyn, each, onMount, portal } from "@continuum-js/dom";
import { state } from "@continuum-js/frp";

let unmounts: Array<() => void> = [];
afterEach(() => {
  for (const u of unmounts) u();
  unmounts = [];
  document.body.replaceChildren();
});

function mountInBody(view: () => Node): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  unmounts.push(mount(container, view));
  return container;
}

describe("onMount", () => {
  test("runs once, after the node is in the document", () => {
    let calls = 0;
    let connectedAtCall = false;
    const el = document.createElement("input");
    mountInBody(() => {
      onMount(() => {
        calls++;
        connectedAtCall = el.isConnected;
      });
      return el;
    });
    expect(calls).toBe(1);
    expect(connectedAtCall).toBe(true);
  });

  test("children mount before parents", () => {
    const order: string[] = [];
    const Child = () => {
      onMount(() => order.push("child"));
      return <span>c</span>;
    };
    mountInBody(() => {
      onMount(() => order.push("parent"));
      return (
        <div>
          <Child />
        </div>
      );
    });
    expect(order).toEqual(["child", "parent"]);
  });

  test("fires for subtrees created by dyn after mount, once inserted", () => {
    const show = state(false);
    const setShow = show.set;
    let connectedAtCall = false;
    const el = document.createElement("p");
    const container = mountInBody(() =>
      dyn(show, (s) => {
        if (!s) return "off";
        onMount(() => {
          connectedAtCall = el.isConnected;
        });
        return el;
      }),
    );
    expect(connectedAtCall).toBe(false);
    setShow(true);
    expect(connectedAtCall).toBe(true);
    expect(container.contains(el)).toBe(true);
  });

  test("fires for rows added by each after mount", () => {
    const items = state<string[]>(["a"]);
    const setItems = items.set;
    const mounted: string[] = [];
    mountInBody(() =>
      each(
        items,
        (s) => s,
        (s) => {
          onMount(() => mounted.push(s));
          return <li>{s}</li>;
        },
      ),
    );
    expect(mounted).toEqual(["a"]);
    setItems(["a", "b"]);
    expect(mounted).toEqual(["a", "b"]);
  });

  test("fires for portal content in the target", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    let connectedAtCall = false;
    const el = document.createElement("em");
    mountInBody(() => {
      const content = () => {
        onMount(() => {
          connectedAtCall = el.isConnected;
        });
        return el;
      };
      return portal(target, content());
    });
    expect(connectedAtCall).toBe(true);
    expect(target.contains(el)).toBe(true);
  });

  test("fires on every dyn re-render, for the subtree that was inserted", () => {
    const v = state(0);
    const setV = v.set;
    const mounted: number[] = [];
    mountInBody(() =>
      dyn(v, (n) => {
        onMount(() => mounted.push(n));
        return <i>{n}</i>;
      }),
    );
    setV(1);
    setV(2);
    expect(mounted).toEqual([0, 1, 2]);
  });

  test("throws outside any owner (a mount hook nobody flushes)", () => {
    expect(() => onMount(() => {})).toThrow(/outside/i);
  });
});
