// animateScroll: a rAF-driven glide of scrollTop — a write per frame, no
// layout read after the initial measure (which happens in a frame pass).
import { describe, test, expect, afterEach, vi } from "vitest";
import { flushFrame } from "@continuum-js/frp";
import { animateScroll } from "./animateScroll.js";

// A controllable rAF: the frame scheduler of frp uses it too, so callbacks
// are tracked by id and cancellation removes them, like the real thing.
const pending = new Map<number, FrameRequestCallback>();
let nextId = 0;
function stubRaf() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    pending.set(++nextId, cb);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => pending.delete(id));
}
function tick(t: number) {
  const cbs = [...pending.values()];
  pending.clear();
  for (const cb of cbs) cb(t);
}

afterEach(() => {
  flushFrame();
  pending.clear();
  vi.unstubAllGlobals();
});

describe("animateScroll", () => {
  test("glides from the current scrollTop to the target over the duration", () => {
    stubRaf();
    const el = document.createElement("div");
    const done = vi.fn();
    animateScroll(el, 300, 200, done);
    flushFrame(); // the initial measure; the first frame is now pending
    expect(el.scrollTop).toBe(0);
    tick(1000); // start
    tick(1100); // halfway
    expect(el.scrollTop).toBeGreaterThan(0);
    expect(el.scrollTop).toBeLessThan(300);
    tick(1200); // arrival
    expect(el.scrollTop).toBe(300);
    expect(done).toHaveBeenCalledTimes(1);
    expect(pending.size).toBe(0); // no frame requested after arrival
  });

  test("duration 0 jumps immediately", () => {
    const el = document.createElement("div");
    animateScroll(el, 120, 0);
    flushFrame();
    expect(el.scrollTop).toBe(120);
  });

  test("a new call takes over the previous glide on the same element", () => {
    stubRaf();
    const el = document.createElement("div");
    animateScroll(el, 300, 200);
    flushFrame();
    tick(0);
    animateScroll(el, 50, 200);
    flushFrame();
    tick(0);
    tick(1000); // well past both durations
    expect(el.scrollTop).toBe(50); // only the second glide is alive
  });
});
