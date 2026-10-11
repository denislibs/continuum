/** @jsxImportSource @continuum-js/dom */
// @continuum-js/dom/layout — layout enters the network as State (browser
// observers), or through `measure` (reads batched into the frame pass,
// results as one moment). jsdom has no ResizeObserver/IntersectionObserver:
// the tests install minimal fakes they can drive.
import { describe, test, expect, afterEach, vi } from "vitest";
import {
  state,
  stream,
  flushFrame,
  inEffectZone,
  withLayout,
  setDevHooks,
} from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";
import {
  createSize,
  createVisibility,
  createScroll,
  measure,
  forceMeasure,
  beginHeavyAnimation,
  isHeavyAnimating,
} from "@continuum-js/dom/layout";

type ROCallback = (
  entries: Array<{ contentRect: { width: number; height: number } }>,
) => void;
type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

const unmounts: Array<() => void> = [];
afterEach(() => {
  flushFrame();
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setDevHooks(null);
});
function mountInBody(view: () => Node): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  unmounts.push(mount(c, view));
  return c;
}

describe("createSize", () => {
  test("is a State fed by ResizeObserver and disconnects on dispose", () => {
    let cb: ROCallback | null = null;
    const observed: Element[] = [];
    let disconnected = 0;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(c: ROCallback) {
          cb = c;
        }
        observe(el: Element) {
          observed.push(el);
        }
        disconnect() {
          disconnected++;
        }
      },
    );
    let size!: ReturnType<typeof createSize>;
    const c = mountInBody(() => {
      const el = (<div />) as HTMLElement;
      size = createSize(el);
      return el;
    });
    expect(observed).toEqual([c.firstElementChild]);
    expect(size.sample()).toEqual({ width: 0, height: 0 });
    cb!([{ contentRect: { width: 100, height: 20 } }]);
    expect(size.sample()).toEqual({ width: 100, height: 20 });
    unmounts.pop()!();
    expect(disconnected).toBe(1);
  });
});

describe("createVisibility", () => {
  test("is a State fed by IntersectionObserver", () => {
    let cb: IOCallback | null = null;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(c: IOCallback) {
          cb = c;
        }
        observe() {}
        disconnect() {}
      },
    );
    let visible!: ReturnType<typeof createVisibility>;
    mountInBody(() => {
      const el = (<div />) as HTMLElement;
      visible = createVisibility(el);
      return el;
    });
    expect(visible.sample()).toBe(false);
    cb!([{ isIntersecting: true }]);
    expect(visible.sample()).toBe(true);
  });
});

describe("createScroll", () => {
  test("follows an element's scroll position and stops on dispose", () => {
    let scroll!: ReturnType<typeof createScroll>;
    const c = mountInBody(() => {
      const el = (<div />) as HTMLElement;
      scroll = createScroll(el);
      return el;
    });
    const el = c.firstElementChild as HTMLElement;
    expect(scroll.sample()).toEqual({ top: 0, left: 0 });
    el.scrollTop = 40;
    el.dispatchEvent(new Event("scroll"));
    expect(scroll.sample()).toEqual({ top: 40, left: 0 });
    unmounts.pop()!();
    el.scrollTop = 80;
    el.dispatchEvent(new Event("scroll"));
    expect(scroll.sample()).toEqual({ top: 40, left: 0 });
  });
});

describe("measure", () => {
  test("reads once per frame with the latest trigger, outside the effect zone", () => {
    const trigger = stream<number>();
    const reads: Array<[number, boolean]> = [];
    const seen: number[] = [];
    mountInBody(() => {
      measure(trigger, (n) => {
        reads.push([n, inEffectZone()]);
        return n * 10;
      }).listen((v) => seen.push(v));
      return <i />;
    });
    trigger.fire(1);
    trigger.fire(2);
    flushFrame();
    expect(reads).toEqual([[2, false]]);
    expect(seen).toEqual([20]);
  });

  test("the results of all measures of a frame enter as ONE moment", () => {
    const a = stream<number>();
    const b = stream<number>();
    const seen: string[] = [];
    mountInBody(() => {
      measure(a, (n) => n).listen((v) => seen.push(`a${v}`));
      measure(b, (n) => n).listen((v) => seen.push(`b${v}`));
      return <i />;
    });
    a.fire(1);
    b.fire(2);
    let moments = 0;
    setDevHooks({ moment: () => moments++ });
    flushFrame();
    expect(seen).toEqual(["a1", "b2"]);
    expect(moments).toBe(1);
  });

  test("a measure whose owner was disposed before the frame does not read", () => {
    const trigger = stream<number>();
    let reads = 0;
    mountInBody(() => {
      measure(trigger, () => reads++);
      return <i />;
    });
    trigger.fire(1);
    unmounts.pop()!();
    flushFrame();
    expect(reads).toBe(0);
  });

  test("a read that throws does not stop the others; the error surfaces from the flush", () => {
    const a = stream<number>();
    const b = stream<number>();
    const seen: number[] = [];
    mountInBody(() => {
      measure(a, () => {
        throw new Error("bad read");
      });
      measure(b, (n) => n).listen((v) => seen.push(v));
      return <i />;
    });
    a.fire(1);
    b.fire(2);
    expect(() => flushFrame()).toThrow("bad read");
    expect(seen).toEqual([2]);
  });

  test("forceMeasure is withLayout", () => {
    expect(forceMeasure).toBe(withLayout);
  });
});

describe("heavy animation", () => {
  test("isHeavyAnimating counts nested animations and ends on the returned handle", () => {
    expect(isHeavyAnimating.sample()).toBe(false);
    const end1 = beginHeavyAnimation();
    const end2 = beginHeavyAnimation();
    expect(isHeavyAnimating.sample()).toBe(true);
    end1();
    expect(isHeavyAnimating.sample()).toBe(true);
    end2();
    expect(isHeavyAnimating.sample()).toBe(false);
    end2(); // idempotent
    expect(isHeavyAnimating.sample()).toBe(false);
  });

  test("an animation nobody ends is ended by its duration", () => {
    vi.useFakeTimers();
    beginHeavyAnimation(300);
    expect(isHeavyAnimating.sample()).toBe(true);
    vi.advanceTimersByTime(299);
    expect(isHeavyAnimating.sample()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isHeavyAnimating.sample()).toBe(false);
  });

  test("the gate composes with holdWhile-style consumers", () => {
    const s = state(0);
    const end = beginHeavyAnimation();
    s.set(1);
    expect(isHeavyAnimating.sample()).toBe(true);
    end();
  });
});
