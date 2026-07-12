import { describe, test, expect } from "vitest";
import {
  root,
  newStream,
  state,
  constant,
  batch,
  State,
  Stream,
  time,
  combine,
  flatten,
} from "@continuum-js/frp";

describe("State.map", () => {
  test("maps sampled value and updates", () => {
    const [n, fire] = newStream<number>();
    const b = root(() => n.hold(1)).map((x) => x * 3);
    expect(b.sample()).toBe(3);
    const seen: number[] = [];
    b.updates.listen((v) => seen.push(v));
    fire(5);
    expect(b.sample()).toBe(15);
    expect(seen).toEqual([15]);
  });
});

describe("State.listen", () => {
  test("delivers current value immediately then on changes", () => {
    const b = state(1);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    set(2);
    set(3);
    expect(seen).toEqual([1, 2, 3]);
  });
});

describe("lift2 / apply", () => {
  test("lift2 combines two behaviors pointwise", () => {
    const a = state(2);
    const setA = a.set;
    const b = state(10);
    const setB = b.set;
    const sum = combine(a, b, (x, y) => x + y);
    expect(sum.sample()).toBe(12);
    setA(5);
    expect(sum.sample()).toBe(15);
    setB(100);
    expect(sum.sample()).toBe(105);
  });

  test("lift2 is glitch-free when both inputs share a source", () => {
    const [n, fire] = newStream<number>();
    const b = root(() => n.hold(1));
    const b2 = b.map((x) => x * 2);
    const combined = combine(b, b2, (x, y) => x + y);
    const seen: number[] = [];
    combined.updates.listen((v) => seen.push(v));
    fire(5); // b=5, b2=10 in one moment -> single coalesced update 15
    expect(seen).toEqual([15]);
    expect(combined.sample()).toBe(15);
  });

  test("apply applies a behavior-of-function to a behavior-of-value", () => {
    const bf = state<(n: number) => number>((n) => n + 1);
    const setF = bf.set;
    const bx = state(10);
    const setX = bx.set;
    const out = combine(bf, bx, (f, x) => f(x));
    expect(out.sample()).toBe(11);
    setF((n) => n * 2);
    expect(out.sample()).toBe(20);
    setX(3);
    expect(out.sample()).toBe(6);
  });

  test("lift3 combines three behaviors", () => {
    const a = state(1);
    const b = state(2);
    const c = state(3);
    const out = combine(a, b, c, (x, y, z) => x + y + z);
    expect(out.sample()).toBe(6);
  });
});

describe("switchB", () => {
  test("follows the currently selected behavior (sample)", () => {
    const outer = state<State<number>>(constant(1));
    const setOuter = outer.set;
    const sw = flatten(outer);
    expect(sw.sample()).toBe(1);
    const b2 = state(10);
    const set2 = b2.set;
    setOuter(b2);
    expect(sw.sample()).toBe(10);
    set2(20);
    expect(sw.sample()).toBe(20);
  });

  test("emits updates from the selected behavior and on switch", () => {
    const outer = state<State<number>>(constant(1));
    const setOuter = outer.set;
    const sw = flatten(outer);
    const seen: number[] = [];
    sw.listen((v) => seen.push(v)); // immediate 1
    const b2 = state(10);
    const set2 = b2.set;
    setOuter(b2); // switch -> emit new inner's current value 10
    set2(20); // inner update flows through
    expect(seen).toEqual([1, 10, 20]);
  });
});

describe("switchE", () => {
  test("follows the currently selected event", () => {
    const [ea, fireA] = newStream<string>();
    const [eb, fireB] = newStream<string>();
    const sel = state<Stream<string>>(ea);
    const setSel = sel.set;
    const out = flatten(sel);
    const seen: string[] = [];
    out.listen((v) => seen.push(v));
    fireA("a1");
    fireB("b1"); // ignored, ea selected
    setSel(eb);
    fireB("b2");
    fireA("a2"); // ignored, eb selected
    expect(seen).toEqual(["a1", "b2"]);
  });
});

describe("continuous behaviors", () => {
  test("fromPoll samples fresh each read", () => {
    let n = 0;
    const b = State.fromPoll(() => n);
    expect(b.sample()).toBe(0);
    n = 42;
    expect(b.sample()).toBe(42);
  });

  test("time is a number that does not go backwards", () => {
    const t = time();
    const a = t.sample();
    const b = t.sample();
    expect(typeof a).toBe("number");
    expect(b).toBeGreaterThanOrEqual(a);
  });
});

describe("listen registration order", () => {
  test("a set fired during the initial delivery is still delivered", () => {
    const b = state(0);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => {
      seen.push(v);
      if (v === 0) set(1);
    });
    expect(seen).toEqual([0, 1]);
  });

  test("a throw in the initial delivery does not leak the subscription", () => {
    const b = state(0);
    const set = b.set;
    let delivered = 0;
    expect(() =>
      b.listen(() => {
        throw new Error("initial boom");
      }),
    ).toThrow("initial boom");
    b.listen(() => delivered++);
    set(1);
    expect(delivered).toBe(2); // initial + update; the broken listener is gone
  });
});

describe("newBehavior equality skip", () => {
  test("setting an equal value does not wake subscribers", () => {
    const b = state(5);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    set(5); // no-op: same value
    set(6);
    set(6); // no-op again
    expect(seen).toEqual([5, 6]);
  });

  test("equality is Object.is: NaN → NaN is a no-op, 0 → -0 is a change", () => {
    const b = state(NaN);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    set(NaN); // Object.is(NaN, NaN) — skipped
    expect(seen.length).toBe(1);
    const z = state(0);
    const setZ = z.set;
    const zs: number[] = [];
    z.listen((v) => zs.push(v));
    setZ(-0); // Object.is(0, -0) is false — delivered
    expect(zs.length).toBe(2);
  });

  test("custom equality", () => {
    const b = state({ id: 1 }, (p, n) => p.id === n.id);
    const set = b.set;
    const seen: Array<{ id: number }> = [];
    b.listen((v) => seen.push(v));
    set({ id: 1 }); // equal by id — skipped
    set({ id: 2 });
    expect(seen.map((v) => v.id)).toEqual([1, 2]);
  });

  test("equality can be disabled: every set is delivered", () => {
    const b = state(1, () => false);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    set(1);
    set(1);
    expect(seen).toEqual([1, 1, 1]);
  });

  test("inside a batch the skip compares against the LAST set, not the pre-moment value", () => {
    const b = state(4);
    const set = b.set;
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    batch(() => {
      set(5);
      set(4); // must NOT be skipped: the last set was 5
    });
    expect(b.sample()).toBe(4);
    expect(seen[seen.length - 1]).toBe(4);
  });
});
