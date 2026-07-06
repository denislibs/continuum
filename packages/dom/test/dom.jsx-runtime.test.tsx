import { describe, test, expect } from "vitest";
// NOTE: no `import { h }` — the automatic JSX runtime supplies it.
import { mount, Show } from "@continuum-js/dom";
import { jsx, jsxs, Fragment } from "@continuum-js/dom/jsx-runtime";
import { newBehavior } from "@continuum-js/frp";

describe("automatic JSX runtime", () => {
  test("JSX works without importing h", () => {
    const [name, setName] = newBehavior("world");
    const container = document.createElement("div");
    mount(container, () => <h1 class="title">hello {name}</h1>);
    const h1 = container.querySelector("h1")!;
    expect(h1.className).toBe("title");
    expect(h1.textContent).toBe("hello world");
    setName("continuum");
    expect(h1.textContent).toBe("hello continuum");
  });

  test("components and control-flow still work without h", () => {
    const [on, setOn] = newBehavior(true);
    const container = document.createElement("div");
    mount(container, () => (
      <Show when={on} fallback={() => <span>off</span>}>
        {() => <span>on</span>}
      </Show>
    ));
    expect(container.textContent).toBe("on");
    setOn(false);
    expect(container.textContent).toBe("off");
  });

  test("jsx/jsxs/Fragment adapters build real nodes", () => {
    const single = jsx("p", { id: "a", children: "hi" }) as HTMLElement;
    expect(single.tagName).toBe("P");
    expect(single.id).toBe("a");
    expect(single.textContent).toBe("hi");

    const many = jsxs("div", { children: ["x", "y"] }) as HTMLElement;
    expect(many.textContent).toBe("xy");

    const frag = jsx(Fragment, { children: ["a", "b"] });
    const box = document.createElement("div");
    box.appendChild(frag);
    expect(box.textContent).toBe("ab");
  });
});
