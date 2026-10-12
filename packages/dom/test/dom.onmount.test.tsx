import { describe, test, expect, afterEach } from "vitest";
import { mount, dyn, each, onMount, portal } from "@continuum-js/dom";
import { state } from "@continuum-js/frp";
import { flushFrame } from "@continuum-js/frp";

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
    flushFrame();
    expect(calls).toBe(1);
    flushFrame();
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
    flushFrame();
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
    flushFrame();
    expect(connectedAtCall).toBe(false);
    setShow(true);
    flushFrame();
    expect(connectedAtCall).toBe(true);
    flushFrame();
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
    flushFrame();
    expect(mounted).toEqual(["a"]);
    setItems(["a", "b"]);
    flushFrame();
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
    flushFrame();
    expect(connectedAtCall).toBe(true);
    flushFrame();
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
    flushFrame();
    setV(2);
    flushFrame();
    expect(mounted).toEqual([0, 1, 2]);
  });

  test("throws outside any owner (a mount hook nobody flushes)", () => {
    flushFrame();
    expect(() => onMount(() => {})).toThrow(/outside/i);
  });
});
