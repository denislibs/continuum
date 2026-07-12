// Characterization of event-handler semantics. Written BEFORE the delegation
// rework (phase 1 of PERF-PLAN) and kept green through it: these are the
// behaviors user code may rely on. Containers attach to document.body —
// delegated dispatch requires a connected tree (same contract as Solid).
import { describe, test, expect, afterEach, vi } from "vitest";
import { mount, h } from "@continuum-js/dom";

const roots: Array<() => void> = [];
function attach(view: () => Node): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const un = mount(el, view);
  roots.push(() => {
    un();
    el.remove();
  });
  return el;
}
afterEach(() => {
  while (roots.length) roots.pop()!();
});

describe("event handlers — characterization", () => {
  test("child handlers run before parent handlers (bubbling order)", () => {
    const order: string[] = [];
    const el = attach(() => (
      <div onClick={() => order.push("parent")}>
        <button onClick={() => order.push("child")}>x</button>
      </div>
    ));
    el.querySelector("button")!.click();
    expect(order).toEqual(["child", "parent"]);
  });

  test("stopPropagation() halts the walk to ancestors", () => {
    const order: string[] = [];
    const el = attach(() => (
      <div onClick={() => order.push("parent")}>
        <button
          onClick={(e: MouseEvent) => {
            order.push("child");
            e.stopPropagation();
          }}
        >
          x
        </button>
      </div>
    ));
    el.querySelector("button")!.click();
    expect(order).toEqual(["child"]);
  });

  test("currentTarget is the element carrying the handler, not the click target", () => {
    let seen: EventTarget | null = null;
    const el = attach(() => (
      <div
        onClick={(e: MouseEvent) => {
          seen = e.currentTarget;
        }}
      >
        <button>x</button>
      </div>
    ));
    el.querySelector("button")!.click();
    expect(seen).toBe(el.firstChild);
  });

  test("event.target is the innermost clicked element", () => {
    let seen: EventTarget | null = null;
    const el = attach(() => (
      <div
        onClick={(e: MouseEvent) => {
          seen = e.target;
        }}
      >
        <button>x</button>
      </div>
    ));
    el.querySelector("button")!.click();
    expect(seen).toBe(el.querySelector("button"));
  });

  test("a handler unmounted with its component no longer fires", () => {
    let calls = 0;
    const el = document.createElement("div");
    document.body.appendChild(el);
    const un = mount(el, () => <button onClick={() => calls++}>x</button>);
    const btn = el.querySelector("button")!;
    btn.click();
    un();
    // the node is out of the document after unmount; clicking the detached
    // node must not reach the handler either way
    btn.click();
    expect(calls).toBe(1);
    el.remove();
  });

  test("non-bubbling events (focus) still work per-element", () => {
    let focused = 0;
    const el = attach(() => <input onFocus={() => focused++} />);
    (el.querySelector("input") as HTMLInputElement).focus();
    expect(focused).toBe(1);
  });

  test("preventDefault works through the handler", () => {
    const el = attach(() => (
      <a href="#nope" onClick={(e: MouseEvent) => e.preventDefault()}>
        x
      </a>
    ));
    const a = el.querySelector("a")!;
    const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
    a.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });
});

describe("each() focus restore — only when a move actually stole it", () => {
  test("no focus() calls when focus is outside the list", async () => {
    const { state } = await import("@continuum-js/frp");
    const { each } = await import("@continuum-js/dom");
    const items = state([1, 2, 3]);
    const outside = document.createElement("input");
    document.body.appendChild(outside);
    const el = attach(() =>
      each(
        items,
        (n) => n,
        (n) => h("span", null, String(n)),
      ),
    );
    void el;
    outside.focus();
    const spy = vi.spyOn(HTMLElement.prototype, "focus");
    items.set([3, 2, 1]); // reorder — focus was never inside the list
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    outside.remove();
  });

  test("focus IS restored when the focused row was moved", async () => {
    const { state } = await import("@continuum-js/frp");
    const { each } = await import("@continuum-js/dom");
    const items = state([1, 2, 3]);
    const el = attach(() =>
      each(
        items,
        (n) => n,
        (n) => h("input", { "data-n": String(n) }),
      ),
    );
    const first = el.querySelector('input[data-n="1"]') as HTMLInputElement;
    first.focus();
    expect(document.activeElement).toBe(first);
    items.set([3, 2, 1]); // the focused row moves
    expect(document.activeElement).toBe(first); // restored
  });
});
