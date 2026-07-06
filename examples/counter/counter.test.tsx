import { describe, test, expect } from "vitest";
import { mount, h } from "@continuum-js/dom";
import { Counter } from "./counter";

describe("Counter (end-to-end DOM -> Event -> Behavior -> DOM)", () => {
  test("clicking patches exactly the bound text node", () => {
    const container = document.createElement("div");
    mount(container, () => <Counter />);
    const btn = container.querySelector("button")!;
    const textNode = btn.lastChild; // the {count} binding
    expect(btn.textContent).toBe("count: 0");
    btn.click();
    btn.click();
    btn.click();
    expect(btn.textContent).toBe("count: 3");
    // the same text node was patched in place (no re-render)
    expect(btn.lastChild).toBe(textNode);
  });
});
