import { describe, test, expect, afterEach, vi } from "vitest";
import { root, newStream, newBehavior, perform } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";
import { debounce } from "@continuum-js/std";
import {
  render,
  cleanup,
  fire,
  click,
  type,
  flush,
  advanceTimers,
} from "../src/index.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Counter() {
  const [clicks, fireClick] = newStream<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fireClick}>count: {count}</button>;
}

describe("render", () => {
  test("mounts the view into a container attached to the document", () => {
    const { container } = render(() => <Counter />);
    expect(container.textContent).toBe("count: 0");
    expect(document.body.contains(container)).toBe(true);
  });

  test("dispose unmounts and removes the container", () => {
    const { container, dispose } = render(() => <Counter />);
    dispose();
    expect(container.textContent).toBe("");
    expect(document.body.contains(container)).toBe(false);
  });

  test("cleanup() disposes every render of the test", () => {
    const a = render(() => <Counter />);
    const b = render(() => <Counter />);
    cleanup();
    expect(document.body.contains(a.container)).toBe(false);
    expect(document.body.contains(b.container)).toBe(false);
  });
});

describe("events", () => {
  test("click drives the FRP network", () => {
    const { container } = render(() => <Counter />);
    const button = container.querySelector("button")!;
    click(button);
    click(button);
    expect(button.textContent).toBe("count: 2");
  });

  test("fire dispatches an arbitrary bubbling event", () => {
    const { container } = render(() => <Counter />);
    const button = container.querySelector("button")!;
    fire(button, new MouseEvent("click", { bubbles: true }));
    expect(button.textContent).toBe("count: 1");
  });

  test("type() fills an input through bindInput", () => {
    const [text, setText] = newBehavior("");
    const { container } = render(() => <input {...bindInput(text, setText)} />);
    const input = container.querySelector("input")!;
    type(input, "abc");
    expect(text.sample()).toBe("abc");
    expect(input.value).toBe("abc");
  });
});

describe("async helpers", () => {
  test("flush() waits for perform results to land", async () => {
    const [req, fireReq] = newStream<number>();
    const res = root(() => perform(req, async (n) => n * 2));
    const seen: number[] = [];
    res.listen((r) => {
      if (r.ok) seen.push(r.value);
    });

    fireReq(21);
    expect(seen).toEqual([]); // promise not settled yet
    await flush();
    expect(seen).toEqual([42]);
  });

  test("advanceTimers() plays a debounce forward under fake timers", async () => {
    vi.useFakeTimers();
    const [e, fireE] = newStream<string>();
    const settled = debounce(e, 200);
    const seen: string[] = [];
    settled.listen((v) => seen.push(v));

    fireE("a");
    fireE("b");
    await advanceTimers(199);
    expect(seen).toEqual([]);
    await advanceTimers(1);
    expect(seen).toEqual(["b"]);
  });
});
