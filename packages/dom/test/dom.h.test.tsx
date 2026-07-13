import { describe, test, expect } from "vitest";
import { mount } from "@continuum-js/dom";
import { root, newStream, state } from "@continuum-js/frp";

describe("h — static elements", () => {
  test("creates an element with attributes and text children", () => {
    const el = (
      <div id="x" title="hello">
        world
      </div>
    ) as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.id).toBe("x");
    expect(el.getAttribute("title")).toBe("hello");
    expect(el.textContent).toBe("world");
  });

  test("class and style object", () => {
    const el = (
      <div class="a b" style={{ color: "red", fontSize: "10px" }} />
    ) as HTMLElement;
    expect(el.className).toBe("a b");
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("10px");
  });

  test("value and checked are set as properties", () => {
    const input = (<input value="hi" />) as HTMLInputElement;
    expect(input.value).toBe("hi");
    const cb = (<input type="checkbox" checked={true} />) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  // #116: props are applied before children, but a <select>'s value needs its
  // options to already exist, so the initial selection used to be lost.
  test("<select value> keeps its initial selection", () => {
    const el = (
      <select value="2">
        <option value="1">one</option>
        <option value="2">two</option>
        <option value="3">three</option>
      </select>
    ) as HTMLSelectElement;
    expect(el.value).toBe("2");
    expect(el.selectedIndex).toBe(1);
  });

  test("<select value={state}> initial selection sticks and stays reactive", () => {
    const v = state("2");
    const set = v.set;
    const el = (
      <select value={v}>
        <option value="1">one</option>
        <option value="2">two</option>
      </select>
    ) as HTMLSelectElement;
    expect(el.value).toBe("2");
    set("1");
    expect(el.value).toBe("1");
  });

  test("ref receives the element (function form)", () => {
    let captured: HTMLElement | null = null;
    (<div ref={(el: HTMLElement) => (captured = el)} />) as HTMLElement;
    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("DIV");
  });

  test("ref receives the element (object form)", () => {
    const ref = { current: null as HTMLElement | null };
    (<div ref={ref} />) as HTMLElement;
    expect(ref.current).not.toBeNull();
    expect(ref.current!.tagName).toBe("DIV");
  });

  test("nested elements and arrays of children", () => {
    const el = (
      <ul>
        {[1, 2, 3].map((n) => (
          <li>{String(n)}</li>
        ))}
      </ul>
    ) as HTMLElement;
    expect(el.querySelectorAll("li").length).toBe(3);
    expect(el.textContent).toBe("123");
  });
});

describe("h — fine-grained bindings", () => {
  test("State child becomes a live text node", () => {
    const b = state("x");
    const set = b.set;
    const el = (<span>{b}</span>) as HTMLElement;
    expect(el.textContent).toBe("x");
    set("y");
    expect(el.textContent).toBe("y");
  });

  test("State prop becomes a live attribute", () => {
    const cls = state("one");
    const setCls = cls.set;
    const el = (<div class={cls} />) as HTMLElement;
    expect(el.className).toBe("one");
    setCls("two");
    expect(el.className).toBe("two");
  });

  test("mixed static and reactive children keep their positions", () => {
    const b = state(1);
    const set = b.set;
    const el = (<div>count: {b}!</div>) as HTMLElement;
    expect(el.textContent).toBe("count: 1!");
    set(2);
    expect(el.textContent).toBe("count: 2!");
  });
});

describe("h — events", () => {
  test("on* handlers attach DOM listeners", () => {
    let fired = 0;
    const btn = (
      <button onClick={() => fired++}>x</button>
    ) as HTMLButtonElement;
    document.body.appendChild(btn); // delegated events need a connected tree
    btn.click();
    btn.click();
    expect(fired).toBe(2);
    btn.remove();
  });

  test("passing an frp `fire` routes DOM events into the network", () => {
    const [clicks, fire] = newStream<MouseEvent>();
    const count = root(() => clicks.accum(0, (_e, n) => n + 1));
    const btn = (<button onClick={fire}>{count}</button>) as HTMLButtonElement;
    document.body.appendChild(btn); // delegated events need a connected tree
    expect(btn.textContent).toBe("0");
    btn.click();
    btn.click();
    expect(btn.textContent).toBe("2");
    btn.remove();
  });
});

describe("h — components", () => {
  test("a component function runs exactly once", () => {
    let calls = 0;
    function Comp(props: { n: import("@continuum-js/frp").State<number> }) {
      calls++;
      return <span>{props.n}</span>;
    }
    const n = state(1);
    const set = n.set;
    const el = (<Comp n={n} />) as HTMLElement;
    expect(calls).toBe(1);
    set(2);
    set(3);
    expect(calls).toBe(1);
    expect(el.textContent).toBe("3");
  });
});

describe("Fragment", () => {
  test("returns multiple siblings", () => {
    const container = document.createElement("div");
    const f = (
      <>
        <span>a</span>
        <span>b</span>
      </>
    ) as Node;
    container.appendChild(f);
    expect(container.childNodes.length).toBe(2);
    expect(container.textContent).toBe("ab");
  });
});

describe("mount / unmount", () => {
  test("mounts a live view and cleans up on unmount", () => {
    const container = document.createElement("div");
    const b = state("x");
    const set = b.set;
    const unmount = mount(container, () => <span>{b}</span>);
    expect(container.textContent).toBe("x");
    set("y");
    expect(container.textContent).toBe("y");
    unmount();
    expect(container.childNodes.length).toBe(0);
    // updates after unmount must not throw
    expect(() => set("z")).not.toThrow();
  });
});
