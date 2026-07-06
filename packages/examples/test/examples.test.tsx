import { describe, test, expect } from "vitest";
import { mount, h } from "@continuum/dom";
import { Counter } from "../src/counter";
import { TodoApp } from "../src/todo";

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

describe("TodoApp", () => {
  test("adds items through the network and reconciles the list", () => {
    const container = document.createElement("div");
    mount(container, () => <TodoApp />);
    const input = container.querySelector("input")!;
    const form = container.querySelector("form")!;

    expect(container.querySelector(".empty")).not.toBeNull();

    const type = (v: string) => {
      input.value = v;
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    };
    const submit = () =>
      form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    type("buy milk");
    submit();
    type("write docs");
    submit();

    expect(container.querySelector(".empty")).toBeNull();
    const items = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent
    );
    expect(items).toEqual(["buy milk", "write docs"]);
    // draft cleared after submit
    expect(input.value).toBe("");
  });
});
