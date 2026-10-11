import { describe, test, expect } from "vitest";
import { root, state } from "@continuum-js/frp";
import { previous, dedupe } from "@continuum-js/std";

// Regression for #117: `dedupe` used an eager `listen_` and dropped its
// unlisten handle, so it never detached from its source — a permanent edge
// (and whole-upstream) leak. The fix makes it demand-activated, so losing its
// last listener puts the whole lazy chain to sleep.

describe("behavior combinators", () => {
  test("previous lags one step behind", () => {
    const b = state(0);
    const setB = b.set;
    const prev = root(() => previous(b, -1));
    expect(prev.sample()).toBe(-1);

    setB(5);
    expect(prev.sample()).toBe(0); // value b held before

    setB(9);
    expect(prev.sample()).toBe(5);
  });

  test("dedupe suppresses updates that don't change the value", () => {
    const b = state(1);
    const setB = b.set;
    const seen: number[] = [];
    const d = dedupe(b);
    d.updates.listen((v) => seen.push(v));

    setB(1); // same value — suppressed
    setB(2); // change — emitted
    setB(2); // same — suppressed
    setB(3); // change — emitted
    expect(seen).toEqual([2, 3]);
  });

  test("dedupe honours a custom equality", () => {
    const b = state({ id: 1 });
    const setB = b.set;
    const seen: number[] = [];
    const d = dedupe(b, (x, y) => x.id === y.id);
    d.updates.listen((v) => seen.push(v.id));

    setB({ id: 1 }); // equal by id — suppressed
    setB({ id: 2 }); // different id — emitted
    expect(seen).toEqual([2]);
  });

  test("dedupe is lazy: detaches its whole upstream once unobserved (#117)", () => {
    root(() => {
      const src = state(0);
      let maps = 0;
      const mapped = src.map((n) => {
        maps++; // runs only while the map node is awake
        return n;
      });
      const d = dedupe(mapped);
      const un = d.updates.listen(() => {});

      const before = maps;
      src.set(1);
      expect(maps).toBeGreaterThan(before); // warm: the chain propagates

      un(); // last listener gone
      const afterUn = maps;
      src.set(2);
      src.set(3);
      // With the leak the eager edge kept `mapped` awake, so `maps` would keep
      // climbing. Fixed: dedupe slept, detached `mapped`, which detached `src`.
      expect(maps).toBe(afterUn);
    });
  });
  test("dedupe reseeds from the live value on wake", () => {
    const b = state(1);
    const setB = b.set;
    const d = dedupe(b);
    d.updates.listen(() => {})(); // warm once, then let it sleep

    setB(2); // changes while nobody listens
    const seen: number[] = [];
    d.updates.listen((v) => seen.push(v));
    setB(2); // equal to the CURRENT value — suppressed, not compared to 1
    setB(3);
    expect(seen).toEqual([3]);
  });
});
