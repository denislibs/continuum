/** @jsxImportSource @continuum-js/dom */
// createVisibilityObserver: ONE IntersectionObserver per list, a State per
// element — 300 message rows must not mean 300 observers.
import { describe, test, expect, afterEach, vi } from "vitest";
import { flushFrame } from "@continuum-js/frp";
import { mount, scope } from "@continuum-js/dom";
import { createVisibilityObserver } from "@continuum-js/dom/layout";

type Entry = { target: Element; isIntersecting: boolean };
type IOCallback = (entries: Entry[]) => void;

let instances = 0;
let cb: IOCallback | null = null;
const observed = new Set<Element>();
let disconnected = 0;

const unmounts: Array<() => void> = [];
afterEach(() => {
  flushFrame();
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  instances = 0;
  cb = null;
  observed.clear();
  disconnected = 0;
});

function stubIO() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(c: IOCallback) {
        instances++;
        cb = c;
      }
      observe(el: Element) {
        observed.add(el);
      }
      unobserve(el: Element) {
        observed.delete(el);
      }
      disconnect() {
        disconnected++;
        observed.clear();
      }
    },
  );
}

describe("createVisibilityObserver", () => {
  test("one observer for many elements, a State each", () => {
    stubIO();
    const states: ReturnType<ReturnType<typeof createVisibilityObserver>>[] =
      [];
    const els: HTMLElement[] = [];
    mountInBody(() => {
      const observe = createVisibilityObserver();
      for (let i = 0; i < 5; i++) {
        const el = (<div />) as HTMLElement;
        els.push(el);
        states.push(observe(el));
      }
      return <div>{els}</div>;
    });
    expect(instances).toBe(1);
    expect(observed.size).toBe(5);
    expect(states.every((s) => s.sample() === false)).toBe(true);
    cb!([{ target: els[2], isIntersecting: true }]);
    expect(states[2].sample()).toBe(true);
    expect(states[1].sample()).toBe(false);
  });

  test("an element's cell stops observing when its owner is disposed", () => {
    stubIO();
    let observe!: ReturnType<typeof createVisibilityObserver>;
    const c = mountInBody(() => {
      observe = createVisibilityObserver();
      return <div />;
    });
    const el = document.createElement("div");
    c.append(el);
    const { dispose } = scope(() => observe(el));
    expect(observed.has(el)).toBe(true);
    dispose();
    expect(observed.has(el)).toBe(false);
  });

  test("disposing the observer's owner disconnects it", () => {
    stubIO();
    mountInBody(() => {
      const observe = createVisibilityObserver();
      observe((<div />) as HTMLElement);
      return <div />;
    });
    unmounts.pop()!();
    expect(disconnected).toBe(1);
  });

  test("a batch of entries in one callback is one moment", () => {
    stubIO();
    const states: ReturnType<ReturnType<typeof createVisibilityObserver>>[] =
      [];
    const els: HTMLElement[] = [];
    mountInBody(() => {
      const observe = createVisibilityObserver();
      for (let i = 0; i < 3; i++) {
        const el = (<div />) as HTMLElement;
        els.push(el);
        states.push(observe(el));
      }
      return <div>{els}</div>;
    });
    let deliveries = 0;
    for (const s of states) s.updates.listen(() => deliveries++);
    cb!(els.map((target) => ({ target, isIntersecting: true })));
    flushFrame();
    expect(deliveries).toBe(3);
    expect(states.map((s) => s.sample())).toEqual([true, true, true]);
  });
});

function mountInBody(view: () => Node): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  unmounts.push(mount(c, view));
  return c;
}
