// Edge bookkeeping locks for the single-observer fast path (round 6): most
// nodes carry exactly ONE edge, and the array must not exist for them. These
// tests pin the delivery semantics across the 0↔1↔2 listener transitions so
// the inline-slot representation cannot drift from the array one:
//   - a listener added DURING delivery does not see that occurrence;
//   - a listener removed DURING delivery still receives it;
//   - wake/sleep fire on the 0↔1 boundary regardless of representation.
import { describe, test, expect } from "vitest";
import { stream, root } from "@continuum-js/frp";

describe("edge bookkeeping — single-observer transitions", () => {
  test("a listener added during single-observer delivery misses that occurrence", () => {
    const s = stream<number>();
    const seen: string[] = [];
    let attached = false;
    s.listen((v) => {
      seen.push(`first:${v}`);
      if (!attached) {
        attached = true;
        s.listen((v2) => seen.push(`second:${v2}`));
      }
    });
    s.fire(1); // second attaches mid-delivery -> must NOT see 1
    expect(seen).toEqual(["first:1"]);
    s.fire(2);
    expect(seen).toEqual(["first:1", "first:2", "second:2"]);
  });

  test("the single listener unsubscribing during delivery still receives it", () => {
    const s = stream<number>();
    const seen: number[] = [];
    const un = s.listen((v) => {
      seen.push(v);
      un(); // self-removal mid-delivery
    });
    s.fire(1);
    expect(seen).toEqual([1]);
    s.fire(2); // nobody left
    expect(seen).toEqual([1]);
  });

  test("1 -> 2 -> 1 -> 0 transitions deliver to exactly the live set", () => {
    const s = stream<number>();
    const a: number[] = [];
    const b: number[] = [];
    const unA = s.listen((v) => a.push(v));
    s.fire(1); // only a
    const unB = s.listen((v) => b.push(v));
    s.fire(2); // both
    unA();
    s.fire(3); // only b
    unB();
    s.fire(4); // nobody
    expect(a).toEqual([1, 2]);
    expect(b).toEqual([2, 3]);
  });

  test("unlisten is idempotent on the single observer", () => {
    const s = stream<number>();
    const seen: number[] = [];
    const un = s.listen((v) => seen.push(v));
    const un2 = s.listen((v) => seen.push(v * 10));
    un();
    un(); // double removal must not disturb the survivor
    s.fire(1);
    expect(seen).toEqual([10]);
    un2();
  });

  test("a pure chain sleeps after its last listener and recomputes when re-listened", () => {
    const s = stream<number>();
    let computes = 0;
    const m = s.map((x) => {
      computes++;
      return x * 2;
    });
    const un1 = s.listen(() => {}); // keeps the SOURCE warm, not the map
    s.fire(1);
    expect(computes).toBe(0); // cold map: no listener, no work
    const un2 = m.listen(() => {});
    s.fire(2);
    expect(computes).toBe(1);
    un2(); // map sleeps again
    s.fire(3);
    expect(computes).toBe(1);
    const un3 = m.listen(() => {}); // re-wake
    s.fire(4);
    expect(computes).toBe(2);
    un1();
    un3();
  });

  test("dispose with a lone observer detaches it and re-listen throws", () => {
    root(() => {
      const s = stream<number>();
      const seen: number[] = [];
      const m = s.map((x) => x);
      m.listen((v) => seen.push(v));
      s.fire(1);
      m.dispose();
      s.fire(2); // chain broken
      expect(seen).toEqual([1]);
      expect(() => m.listen(() => {})).toThrow(/disposed/);
    });
  });
});
