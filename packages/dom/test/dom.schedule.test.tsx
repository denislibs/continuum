/** @jsxImportSource @continuum-js/dom */
// Spike: `schedule: "frame"` seen from the renderer — N updates between
// frames become ONE region rebuild and ONE text write.
import { describe, test, expect, afterEach } from "vitest";
import { state, setSchedule, flushFrame } from "@continuum-js/frp";
import { Dynamic, Each, mount } from "@continuum-js/dom";

const unmounts: Array<() => void> = [];
function render(view: () => Node): { container: HTMLElement } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  unmounts.push(mount(container, view));
  return { container };
}

afterEach(() => {
  flushFrame();
  setSchedule("sync");
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
});

describe("frame schedule in the renderer", () => {
  test("sync: 100 sets rebuild a dynamic region 100 times", () => {
    const n = state(0);
    let builds = 0;
    render(() => (
      <Dynamic value={n}>
        {(v) => {
          builds++;
          return <b>{String(v)}</b>;
        }}
      </Dynamic>
    ));
    builds = 0;
    for (let i = 1; i <= 100; i++) n.set(i);
    expect(builds).toBe(100);
  });

  test("frame: 100 sets rebuild a dynamic region ONCE, with the final value", () => {
    setSchedule("frame");
    const n = state(0);
    let builds = 0;
    const r = render(() => (
      <Dynamic value={n}>
        {(v) => {
          builds++;
          return <b>{String(v)}</b>;
        }}
      </Dynamic>
    ));
    builds = 0;
    for (let i = 1; i <= 100; i++) n.set(i);
    expect(builds).toBe(0);
    expect(r.container.textContent).toBe("0");
    flushFrame();
    expect(builds).toBe(1);
    expect(r.container.textContent).toBe("100");
  });

  test("frame: a keyed list reconciles once per frame", () => {
    setSchedule("frame");
    const items = state<number[]>([]);
    let rowBuilds = 0;
    const r = render(() => (
      <ul>
        <Each each={items} by={(i: number) => i}>
          {(i: number) => {
            rowBuilds++;
            return <li>{String(i)}</li>;
          }}
        </Each>
      </ul>
    ));
    // 50 incremental appends between frames
    for (let i = 1; i <= 50; i++) items.set([...items.sample(), i]);
    expect(rowBuilds).toBe(0);
    flushFrame();
    expect(rowBuilds).toBe(50); // each row built exactly once …
    expect(r.container.querySelectorAll("li").length).toBe(50); // … in one pass
  });

  test("frame: a text binding is written once with the final value", () => {
    setSchedule("frame");
    const s = state("a");
    const r = render(() => <p>{s}</p>);
    const text = r.container.querySelector("p")!.firstChild as Text;
    let writes = 0;
    const orig = Object.getOwnPropertyDescriptor(
      CharacterData.prototype,
      "data",
    )!;
    Object.defineProperty(text, "data", {
      set(v: string) {
        writes++;
        orig.set!.call(this, v);
      },
      get() {
        return orig.get!.call(this);
      },
      configurable: true,
    });
    s.set("b");
    s.set("c");
    s.set("d");
    flushFrame();
    expect(writes).toBe(1);
    expect(r.container.textContent).toBe("d");
  });
});
