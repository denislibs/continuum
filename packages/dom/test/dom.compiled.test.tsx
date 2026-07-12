// The compiled-template runtime, tested directly (the vite plugin emits
// exactly these calls). Semantics must match the runtime JSX factory.
import { describe, test, expect, afterEach } from "vitest";
import { wire } from "@continuum-js/frp";
import { root } from "@continuum-js/dom";
import { tmpl, insert, prop, event } from "@continuum-js/dom/compiled";

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()!();
});

describe("compiled runtime", () => {
  test("tmpl parses once and clones per instantiation", () => {
    const t = tmpl(`<tr><td class="col-md-1"></td><td></td></tr>`);
    const a = t();
    const b = t();
    expect(a).not.toBe(b);
    expect(a.outerHTML).toBe(b.outerHTML);
    expect((a as HTMLElement).tagName).toBe("TR"); // table parts parse fine
  });

  test("insert binds a wire as a live text node at an anchor", () => {
    root((dispose) => {
      const w = wire("a");
      const t = tmpl(`<div>[<!>]</div>`)();
      const marker = t.firstChild!.nextSibling!; // the <!> comment
      insert(t, w, marker);
      expect(t.textContent).toBe("[a]");
      w.set("b");
      expect(t.textContent).toBe("[b]");
      dispose();
    });
  });

  test("prop binds a wire attribute and applies plain values once", () => {
    root((dispose) => {
      const cls = wire("danger");
      const el = tmpl(`<tr></tr>`)();
      prop(el, "class", cls);
      prop(el, "data-id", 7);
      expect(el.className).toBe("danger");
      expect(el.getAttribute("data-id")).toBe("7");
      cls.set("");
      expect(el.className).toBe("");
      dispose();
    });
  });

  test("event registers a delegated handler that dies with the node", () => {
    let calls = 0;
    const el = tmpl(`<button>x</button>`)() as HTMLButtonElement;
    event(el, "click", () => calls++);
    document.body.appendChild(el);
    cleanup.push(() => el.remove());
    el.click();
    expect(calls).toBe(1);
    el.remove();
    el.click(); // detached: delegated dispatch no longer reaches it
    expect(calls).toBe(1);
  });
});
