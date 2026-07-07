// ROADMAP v0.6 audit: duplicate keys in <Each> have DETERMINISTIC semantics —
// the first occurrence wins, later duplicates are ignored. Pinned here.
import { describe, test, expect, afterEach } from "vitest";
import { mount, Each } from "@continuum-js/dom";
import { newBehavior } from "@continuum-js/frp";

let unmounts: Array<() => void> = [];
afterEach(() => {
  for (const u of unmounts) u();
  unmounts = [];
});

type Item = { id: number; text: string };

function render(items: Parameters<typeof newBehavior<Item[]>>[0]) {
  const [list, setList] = newBehavior<Item[]>(items);
  const container = document.createElement("div");
  unmounts.push(
    mount(container, () => (
      <ul>
        <Each each={list} by={(it: Item) => it.id}>
          {(it: Item) => <li>{it.text}</li>}
        </Each>
      </ul>
    )),
  );
  return { container, setList };
}

describe("<Each> with duplicate keys", () => {
  test("the first occurrence wins; later duplicates are ignored", () => {
    const { container } = render([
      { id: 1, text: "first" },
      { id: 1, text: "shadowed" },
      { id: 2, text: "two" },
      { id: 2, text: "also shadowed" },
    ]);
    const texts = [...container.querySelectorAll("li")].map(
      (li) => li.textContent,
    );
    expect(texts).toEqual(["first", "two"]);
  });

  test("updates with duplicates neither duplicate DOM nor rebuild the kept row", () => {
    const { container, setList } = render([{ id: 1, text: "first" }]);
    const original = container.querySelector("li");

    setList([
      { id: 1, text: "renamed" },
      { id: 1, text: "dup" },
    ]);

    const lis = container.querySelectorAll("li");
    expect(lis.length).toBe(1);
    // Same key → the live row is reused as-is (rows build once per key).
    expect(lis[0]).toBe(original);
    expect(lis[0].textContent).toBe("first");
  });

  test("reordering around duplicates keeps one live row per key", () => {
    const { container, setList } = render([
      { id: 1, text: "one" },
      { id: 2, text: "two" },
    ]);
    const [one, two] = [...container.querySelectorAll("li")];

    setList([
      { id: 2, text: "two" },
      { id: 1, text: "one" },
      { id: 2, text: "dup of two" },
    ]);

    const lis = [...container.querySelectorAll("li")];
    expect(lis.length).toBe(2);
    expect(lis[0]).toBe(two); // reordered, not rebuilt
    expect(lis[1]).toBe(one);
  });

  test("dropping the key entirely and re-adding it builds a fresh row", () => {
    const { container, setList } = render([
      { id: 1, text: "old" },
      { id: 1, text: "dup" },
    ]);
    const original = container.querySelector("li");

    setList([]);
    expect(container.querySelectorAll("li").length).toBe(0);

    setList([{ id: 1, text: "new" }]);
    const li = container.querySelector("li")!;
    expect(li.textContent).toBe("new");
    expect(li).not.toBe(original);
  });
});
