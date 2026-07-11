// Demand-driven activation: a pure derivation is a RECIPE until somebody
// listens — it attaches to its inputs at the first listener and detaches at
// the last one. Stateful nodes (hold/accum/once/distinct) stay eager: their
// value depends on the full history and must not miss occurrences.
import { describe, test, expect } from "vitest";
import { newStream, newBehavior, Behavior, Stream } from "@continuum-js/frp";

describe("lazy activation — pure derivations", () => {
  test("a chain nobody listens to never runs its callbacks", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    src.map((x) => {
      calls++;
      return x;
    });
    fire(1);
    expect(calls).toBe(0); // cold: not attached to the source at all
  });

  test("a dropped chain costs the source nothing (the leak-class probe)", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    for (let i = 0; i < 1000; i++) {
      src.map((x) => {
        calls++;
        return x;
      });
    }
    fire(1);
    expect(calls).toBe(0); // was 1000 with eager attachment
  });

  test("the first listener wakes the whole chain, delivery works", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const leaf = src
      .map((x) => {
        calls++;
        return x + 1;
      })
      .map((x) => x * 10)
      .filter((x) => x > 0);
    const seen: number[] = [];
    leaf.listen((v) => seen.push(v)); // demand propagates up to src
    fire(1);
    expect(seen).toEqual([20]);
    expect(calls).toBe(1);
  });

  test("after the last listener leaves, the chain sleeps — and WAKES AGAIN", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const m = src.map((x) => {
      calls++;
      return x;
    });
    const un = m.listen(() => {});
    fire(1);
    expect(calls).toBe(1);

    un(); // last listener leaves -> chain detaches
    fire(2);
    expect(calls).toBe(1); // asleep: callback did not run

    // the node is NOT dead: a new listener revives it (no "disposed" throw)
    const seen: number[] = [];
    m.listen((v) => seen.push(v));
    fire(3);
    expect(seen).toEqual([3]);
    expect(calls).toBe(2);
  });

  test("a shared node sleeps only when BOTH consumers are gone", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const mid = src.map((x) => {
      calls++;
      return x;
    });
    const unA = mid.map((x) => x).listen(() => {});
    const unB = mid.map((x) => x).listen(() => {});
    fire(1);
    expect(calls).toBe(1);
    unA();
    fire(2);
    expect(calls).toBe(2); // B still demands mid
    unB();
    fire(3);
    expect(calls).toBe(2); // nobody left
  });

  test("sample() answers correctly on a completely cold Behavior chain", () => {
    const [b, set] = newBehavior(2);
    const derived = b.map((x) => x * 10).map((x) => x + 1);
    expect(derived.sample()).toBe(21); // pull needs no subscription
    set(5);
    expect(derived.sample()).toBe(51); // still correct while cold
  });

  test("merge is lazy and still coalesces after waking", () => {
    const [ea, fireA] = newStream<number>();
    const [eb] = newStream<number>();
    let combines = 0;
    const m = Stream.merge(ea, eb, (l, r) => {
      combines++;
      return l + r;
    });
    fireA(1); // cold: nothing happens
    expect(combines).toBe(0);
    const seen: number[] = [];
    m.listen((v) => seen.push(v));
    fireA(2);
    expect(seen).toEqual([2]);
  });

  test("retain() keeps a chain warm across listener churn", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const warm = src.map((x) => {
      calls++;
      return x;
    });
    warm.retain();
    const un = warm.listen(() => {});
    fire(1);
    un(); // zero listeners, but pinned
    fire(2);
    expect(calls).toBe(2); // still attached, still computing
  });

  test("explicit dispose still kills a node for good", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const m = src.map((x) => {
      calls++;
      return x;
    });
    m.listen(() => {});
    m.dispose();
    fire(1);
    expect(calls).toBe(0);
  });
});

describe("lazy activation — stateful nodes stay eager", () => {
  test("accum counts occurrences even with zero listeners (history must not be lost)", () => {
    const [src, fire] = newStream<number>();
    const total = src.accum(0, (a, s) => s + a);
    fire(1);
    fire(2);
    expect(total.sample()).toBe(3); // attached from construction
  });

  test("hold tracks the last occurrence without listeners", () => {
    const [src, fire] = newStream<number>();
    const last = src.hold(0);
    fire(42);
    expect(last.sample()).toBe(42);
  });
});

describe("lazy activation — lift caches reseed on wake", () => {
  test("inputs changed while cold are picked up when the node wakes", () => {
    const [a, setA] = newBehavior(1);
    const [b, setB] = newBehavior(10);
    const sum = Behavior.lift2((x, y) => x + y, a, b);
    // change inputs while sum is COLD
    setA(2);
    setB(20);
    // wake it up
    const seen: number[] = [];
    sum.listen((v) => seen.push(v));
    expect(seen).toEqual([22]); // initial delivery: fresh, not construction-time
    // one input changes: the flush must combine with the OTHER fresh value
    setA(3);
    expect(seen).toEqual([22, 23]); // 3 + 20, NOT 3 + 10
  });

  test("glitch-freedom survives a sleep/wake cycle (diamond)", () => {
    const [n, setN] = newBehavior(2);
    const d = n.map((x) => x * 2);
    const s = n.map((x) => x * x);
    const sum = Behavior.lift2((x, y) => x + y, d, s);
    const un = sum.listen(() => {});
    un(); // sleep
    setN(3); // changes while cold
    const seen: number[] = [];
    sum.listen((v) => seen.push(v)); // wake
    setN(4);
    expect(seen).toEqual([15, 24]); // 6+9 then 8+16 — never a mixed state
  });
});
