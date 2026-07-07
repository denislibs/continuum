import { describe, test, expect } from "vitest";
import { Event, newEvent, newBehavior, Behavior } from "@continuum-js/frp";

describe("rank maintenance (ensureBiggerThan)", () => {
  test("subscribing a low-rank node under a high-rank source bumps it and propagates", () => {
    const src = new Event<number>(); // rank 0
    const mid = src.map((x) => x); // rank 1
    const leaf = mid.map((x) => x); // rank 2
    expect(src.rank).toBe(0);
    expect(mid.rank).toBe(1);
    expect(leaf.rank).toBe(2);

    // Force a high-rank producer upstream of src: src becomes a target of it.
    const high = new Event<number>(5);
    high.listen_(src, () => {});

    // src must now sit above `high`, and the bump must propagate downstream.
    expect(src.rank).toBeGreaterThan(high.rank);
    expect(mid.rank).toBeGreaterThan(src.rank);
    expect(leaf.rank).toBeGreaterThan(mid.rank);
  });

  test("switching to a deeper inner event keeps the switch output above it", () => {
    const [shallow, fireS] = newEvent<number>();
    // a deep chain, higher rank than a fresh switch output would start with
    const [deepSrc, fireD] = newEvent<number>();
    const deep = deepSrc
      .map((x) => x)
      .map((x) => x)
      .map((x) => x)
      .map((x) => x); // rank ~4

    const [sel, setSel] = newBehavior<Event<number>>(shallow);
    const out = Behavior.switchE(sel);

    const seen: number[] = [];
    out.listen((v) => seen.push(v));

    fireS(1);
    setSel(deep); // switch to the deep event
    expect(out.rank).toBeGreaterThan(deep.rank);
    fireD(2);
    fireS(9); // ignored now
    expect(seen).toEqual([1, 2]);
  });
});

describe("cycle detection", () => {
  test("a dependency cycle throws instead of looping forever", () => {
    const a = new Event<number>();
    const b = new Event<number>();
    a.listen_(b, () => {}); // b is downstream of a
    // making a downstream of b closes the loop -> cycle
    expect(() => b.listen_(a, () => {})).toThrow(/cycle/i);
  });
});

describe("ranks do not break existing coalescing", () => {
  test("merge still coalesces after an output rank bump", () => {
    const [srcA, fireA] = newEvent<number>();
    const [srcB, fireB] = newEvent<number>();
    const merged = Event.merge(srcA, srcB, (x, y) => x + y);

    // subscribe merged under a high-rank producer to force a bump
    const high = new Event<number>(20);
    high.listen_(merged, () => {});
    expect(merged.rank).toBeGreaterThan(high.rank);

    const seen: number[] = [];
    merged.listen((v) => seen.push(v));
    fireA(1);
    fireB(2);
    expect(seen).toEqual([1, 2]);
  });
});

describe("long-run rank stability (§14 #6)", () => {
  test("re-pointing a switch from a deep chain back to a shallow one rebases its rank", () => {
    const [shallow] = newEvent<number>();
    const [deepSrc] = newEvent<number>();
    let deep: Event<number> = deepSrc;
    for (let i = 0; i < 40; i++) deep = deep.map((x) => x);

    const [sel, setSel] = newBehavior<Event<number>>(shallow);
    const out = Behavior.switchE(sel);
    const un = out.listen(() => {});

    setSel(deep); // rank must climb above the deep chain
    expect(out.rank).toBeGreaterThan(40);
    setSel(shallow); // ...and come back down to the live topology
    expect(out.rank).toBeLessThan(10);
    un();
  });

  test("a dependency cycle woven through switches fails loudly, not silently degrades", () => {
    // Two switches, each re-pointed at a FRESH chain derived from the other's
    // output. Before dead targets were refcounted away, this ratcheted ranks
    // upward forever (each round +4, unbounded); with only live edges left,
    // the ordinary cycle detector sees the truth and throws immediately.
    const [selA, setSelA] = newBehavior<Event<number>>(newEvent<number>()[0]);
    const [selB, setSelB] = newBehavior<Event<number>>(newEvent<number>()[0]);
    const swA = Behavior.switchE(selA);
    const swB = Behavior.switchE(selB);
    const unA = swA.listen(() => {});
    const unB = swB.listen(() => {});

    expect(() => {
      for (let i = 0; i < 100; i++) {
        setSelA(swB.map((x) => x + 1));
        setSelB(swA.map((x) => x + 1));
      }
    }).toThrow(/cycle/i);
    unA();
    unB();
  });

  test("a long-lived source does not accumulate dead targets", () => {
    const [src, fire] = newEvent<number>();
    for (let i = 0; i < 1_000; i++) {
      const derived = src.map((x) => x);
      const un = derived.listen(() => {});
      un(); // cascade disposes `derived`
    }
    fire(1);
    const targets = (
      src as unknown as { targets: Map<unknown, unknown> | Set<unknown> }
    ).targets;
    expect(targets.size).toBeLessThanOrEqual(1);
  });
});
