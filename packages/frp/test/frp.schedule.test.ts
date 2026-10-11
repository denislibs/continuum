// Spike: `schedule: "frame"` — observers deferred to one pass per animation
// frame. Bindings (`observe_`) are level-triggered: one delivery per frame
// with the latest value. Effects (`listen`) are edge-triggered: every
// occurrence is delivered. Measures run before any binding writes.
import { describe, test, expect, afterEach } from "vitest";
import {
  state,
  stream,
  observe_,
  unobserve_,
  setSchedule,
  getSchedule,
  flushFrame,
  requestMeasure,
} from "@continuum-js/frp";

afterEach(() => {
  flushFrame();
  setSchedule("sync");
});

describe("schedule: sync (default)", () => {
  test("is the default and delivers observers before set() returns", () => {
    expect(getSchedule()).toBe("sync");
    const s = state(0);
    const seen: number[] = [];
    s.updates.listen((v) => seen.push(v));
    s.set(1);
    expect(seen).toEqual([1]);
  });
});

describe("schedule: frame", () => {
  test("bindings are not delivered until flushFrame()", () => {
    setSchedule("frame");
    const s = state(0);
    const seen: number[] = [];
    observe_(s.updates, (v) => seen.push(v));
    s.set(1);
    expect(s.sample()).toBe(1); // the graph is still synchronous
    expect(seen).toEqual([]); // the DOM side is not
    flushFrame();
    expect(seen).toEqual([1]);
  });

  test("a binding gets ONE delivery per frame, with the latest value", () => {
    setSchedule("frame");
    const s = state(0);
    const seen: number[] = [];
    observe_(s.updates, (v) => seen.push(v));
    for (let i = 1; i <= 100; i++) s.set(i);
    flushFrame();
    expect(seen).toEqual([100]);
  });

  test("an effect (listen) gets EVERY occurrence, in order, at the flush", () => {
    setSchedule("frame");
    const clicks = stream<number>();
    const seen: number[] = [];
    clicks.listen((v) => seen.push(v));
    clicks.fire(1);
    clicks.fire(2);
    clicks.fire(3);
    expect(seen).toEqual([]);
    flushFrame();
    expect(seen).toEqual([1, 2, 3]);
  });

  test("measures run before bindings, bindings before effects", () => {
    setSchedule("frame");
    const s = state(0);
    const log: string[] = [];
    observe_(s.updates, () => log.push("binding"));
    s.updates.listen(() => log.push("effect"));
    s.set(1);
    requestMeasure(() => log.push("measure"));
    flushFrame();
    expect(log).toEqual(["measure", "binding", "effect"]);
  });

  test("a set() inside a flushed observer lands in the same flush", () => {
    setSchedule("frame");
    const a = state(0);
    const b = state(0);
    const seenB: number[] = [];
    observe_(b.updates, (v) => seenB.push(v));
    a.updates.listen((v) => b.set(v * 10));
    a.set(1);
    flushFrame();
    expect(seenB).toEqual([10]);
  });

  test("a binding removed before the flush is not delivered", () => {
    setSchedule("frame");
    const s = state(0);
    const seen: number[] = [];
    const h = observe_(s.updates, (v) => seen.push(v));
    s.set(1);
    unobserve_(s.updates, h);
    flushFrame();
    expect(seen).toEqual([]);
  });

  test("a throwing observer does not stop the others; the first error is rethrown", () => {
    setSchedule("frame");
    const s = state(0);
    const seen: number[] = [];
    observe_(s.updates, () => {
      throw new Error("boom");
    });
    observe_(s.updates, (v) => seen.push(v));
    s.set(1);
    expect(() => flushFrame()).toThrow("boom");
    expect(seen).toEqual([1]);
  });

  test("flushFrame() with nothing pending is a no-op", () => {
    setSchedule("frame");
    expect(() => flushFrame()).not.toThrow();
  });

  test("switching back to sync restores immediate delivery", () => {
    setSchedule("frame");
    setSchedule("sync");
    const s = state(0);
    const seen: number[] = [];
    observe_(s.updates, (v) => seen.push(v));
    s.set(1);
    expect(seen).toEqual([1]);
  });

  test("pending work is flushed by the scheduler without an explicit flushFrame()", async () => {
    setSchedule("frame");
    const s = state(0);
    const seen: number[] = [];
    observe_(s.updates, (v) => seen.push(v));
    s.set(1);
    await new Promise((r) => setTimeout(r, 60)); // > the 35 ms timeout fallback
    expect(seen).toEqual([1]);
  });
});
