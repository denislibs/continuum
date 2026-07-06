import { describe, test, expect } from "vitest";
import { mount } from "@continuum-js/dom";
import { App } from "./App.js";

describe("App", () => {
  test("counts clicks", () => {
    const container = document.createElement("div");
    mount(container, () => <App />);

    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("count: 0");

    button.dispatchEvent(new MouseEvent("click"));
    expect(button.textContent).toBe("count: 1");
  });
});
