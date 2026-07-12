import { describe, test, expect, afterEach } from "vitest";
import { mount } from "@continuum-js/dom";
import { Showcase } from "./showcase";

let unmount: (() => void) | null = null;
afterEach(() => {
  unmount?.();
  unmount = null;
});

describe("Showcase", () => {
  test("<Dynamic> switches the tab panel", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    unmount = mount(container, () => <Showcase />);
    expect(container.querySelector(".panel")!.textContent).toContain(
      "Welcome home",
    );
    container.querySelector<HTMLButtonElement>(".tab-about")!.click();
    expect(container.querySelector(".panel")!.textContent).toContain("About");
  });

  test("<Show> + <Portal> open/close a modal in document.body", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    unmount = mount(container, () => <Showcase />);
    expect(document.body.querySelector(".modal")).toBeNull();

    container.querySelector<HTMLButtonElement>(".open")!.click();
    const modal = document.body.querySelector(".modal");
    expect(modal).not.toBeNull();

    document.body.querySelector<HTMLButtonElement>(".close")!.click();
    expect(document.body.querySelector(".modal")).toBeNull();
  });

  test("unmount tears down a portalled modal", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    unmount = mount(container, () => <Showcase />);
    container.querySelector<HTMLButtonElement>(".open")!.click();
    expect(document.body.querySelector(".modal")).not.toBeNull();
    unmount();
    unmount = null;
    expect(document.body.querySelector(".modal")).toBeNull();
  });
});
