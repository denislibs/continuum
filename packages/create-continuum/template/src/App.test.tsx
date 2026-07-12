import { describe, test, expect } from "vitest";
import { mount } from "@continuum-js/dom";
import { App } from "./App.js";

describe("App", () => {
  test("counts clicks", () => {
    const container = document.createElement("div");
    // events are delegated through the document — the tree must be connected
    document.body.appendChild(container);
    mount(container, () => <App />);

    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("count: 0");

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(button.textContent).toBe("count: 1");
    container.remove();
  });
});
