import { describe, test, expect } from "vitest";
import {
  newStream,
  newBehavior,
  constant,
  Behavior,
  Stream,
  time,
} from "@continuum-js/frp";

describe("Behavior.map", () => {
  test("maps sampled value and updates", () => {
    const [n, fire] = newStream<number>();
    const b = n.hold(1).map((x) => x * 3);
    expect(b.sample()).toBe(3);
    const seen: number[] = [];
    b.updates.listen((v) => seen.push(v));
    fire(5);
    expect(b.sample()).toBe(15);
    expect(seen).toEqual([15]);
  });
});

describe("Behavior.listen", () => {
  test("delivers current value immediately then on changes", () => {
    const [b, set] = newBehavior(1);
    const seen: number[] = [];
    b.listen((v) => seen.push(v));
    set(2);
    set(3);
    expect(seen).toEqual([1, 2, 3]);
  });
});

describe("lift2 / apply", () => {
  test("lift2 combines two behaviors pointwise", () => {
    const [a, setA] = newBehavior(2);
    const [b, setB] = newBehavior(10);
    const sum = Behavior.lift2((x, y) => x + y, a, b);
    expect(sum.sample()).toBe(12);
    setA(5);
    expect(sum.sample()).toBe(15);
    setB(100);
    expect(sum.sample()).toBe(105);
  });

  test("lift2 is glitch-free when both inputs share a source", () => {
    const [n, fire] = newStream<number>();
    const b = n.hold(1);
    const b2 = b.map((x) => x * 2);
    const combined = Behavior.lift2((x, y) => x + y, b, b2);
    const seen: number[] = [];
    combined.updates.listen((v) => seen.push(v));
    fire(5); // b=5, b2=10 in one moment -> single coalesced update 15
    expect(seen).toEqual([15]);
    expect(combined.sample()).toBe(15);
  });

  test("apply applies a behavior-of-function to a behavior-of-value", () => {
    const [bf, setF] = newBehavior<(n: number) => number>((n) => n + 1);
    const [bx, setX] = newBehavior(10);
    const out = Behavior.apply(bf, bx);
    expect(out.sample()).toBe(11);
    setF((n) => n * 2);
    expect(out.sample()).toBe(20);
    setX(3);
    expect(out.sample()).toBe(6);
  });

  test("lift3 combines three behaviors", () => {
    const [a] = newBehavior(1);
    const [b] = newBehavior(2);
    const [c] = newBehavior(3);
    const out = Behavior.lift3((x, y, z) => x + y + z, a, b, c);
    expect(out.sample()).toBe(6);
  });
});

describe("switchB", () => {
  test("follows the currently selected behavior (sample)", () => {
    const [outer, setOuter] = newBehavior<Behavior<number>>(constant(1));
    const sw = Behavior.switchB(outer);
    expect(sw.sample()).toBe(1);
    const [b2, set2] = newBehavior(10);
    setOuter(b2);
    expect(sw.sample()).toBe(10);
    set2(20);
    expect(sw.sample()).toBe(20);
  });

  test("emits updates from the selected behavior and on switch", () => {
    const [outer, setOuter] = newBehavior<Behavior<number>>(constant(1));
    const sw = Behavior.switchB(outer);
    const seen: number[] = [];
    sw.listen((v) => seen.push(v)); // immediate 1
    const [b2, set2] = newBehavior(10);
    setOuter(b2); // switch -> emit new inner's current value 10
    set2(20); // inner update flows through
    expect(seen).toEqual([1, 10, 20]);
  });
});

describe("switchE", () => {
  test("follows the currently selected event", () => {
    const [ea, fireA] = newStream<string>();
    const [eb, fireB] = newStream<string>();
    const [sel, setSel] = newBehavior<Stream<string>>(ea);
    const out = Behavior.switchE(sel);
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
    const b = Behavior.fromPoll(() => n);
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
    const [b, set] = newBehavior(0);
    const seen: number[] = [];
    b.listen((v) => {
      seen.push(v);
      if (v === 0) set(1);
    });
    expect(seen).toEqual([0, 1]);
  });

  test("a throw in the initial delivery does not leak the subscription", () => {
    const [b, set] = newBehavior(0);
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
