import { describe, test, expect, vi, afterEach } from "vitest";
import { mount } from "@continuum-js/dom";
import { UserSearch, type User } from "./search";

describe("UserSearch", () => {
  afterEach(() => vi.useRealTimers());

  const type = (input: HTMLInputElement, v: string) => {
    input.value = v;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  };

  test("debounces typing, shows loading, then renders fetched users", async () => {
    vi.useFakeTimers();
    let resolve!: (u: User[]) => void;
    const calls: string[] = [];
    const search = (q: string) => {
      calls.push(q);
      return new Promise<User[]>((r) => (resolve = r));
    };

    const container = document.createElement("div");
    mount(container, () => <UserSearch search={search} />);
    const input = container.querySelector("input")!;

    // hint shown while idle
    expect(container.querySelector(".hint")).not.toBeNull();

    // a burst of keystrokes within the debounce window → one fetch
    type(input, "a");
    type(input, "an");
    type(input, "ann");
    await vi.advanceTimersByTimeAsync(299);
    expect(calls).toEqual([]); // debounced, no fetch yet

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(["ann"]);
    expect(container.querySelector(".loading")).not.toBeNull();

    resolve([
      { id: 1, login: "ann" },
      { id: 2, login: "annie" },
    ]);
    await vi.advanceTimersByTimeAsync(0);

    expect(container.querySelector(".loading")).toBeNull();
    const items = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent,
    );
    expect(items).toEqual(["ann", "annie"]);
  });

  test("shows an empty state when the query yields nothing", async () => {
    vi.useFakeTimers();
    const search = () => Promise.resolve<User[]>([]);
    const container = document.createElement("div");
    mount(container, () => <UserSearch search={search} />);
    const input = container.querySelector("input")!;

    type(input, "zzz");
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(0);

    expect(container.querySelector(".empty")).not.toBeNull();
    expect(container.querySelectorAll("li").length).toBe(0);
  });
});
