import { describe, test, expect } from "vitest";
import { mount } from "@continuum-js/dom";
import { TodoApp } from "./todo";

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
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );

    type("buy milk");
    submit();
    type("write docs");
    submit();

    expect(container.querySelector(".empty")).toBeNull();
    const items = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["buy milk", "write docs"]);
    // draft cleared after submit
    expect(input.value).toBe("");
  });
});
