import { describe, test, expect } from "vitest";
import { newEvent } from "@continuum-js/frp";

describe("error semantics (§5.1 + isolation)", () => {
  test("exception in a combinator propagates but the engine recovers", () => {
    const [e, fire] = newEvent<number>();
    const seen: number[] = [];
    e.map((n) => {
      if (n === 2) throw new Error("bad");
      return n;
    }).listen((v) => seen.push(v));

    fire(1);
    expect(() => fire(2)).toThrow("bad");
    fire(3); // subsequent moments still work
    expect(seen).toEqual([1, 3]);
  });

  test("a dropped moment does not commit behavior state", () => {
    const [e, fire] = newEvent<number>();
    // hold fed by a mapping that throws on 99
    const mapped = e.map((n) => {
      if (n === 99) throw new Error("nope");
      return n;
    });
    const b = mapped.hold(0);
    fire(5);
    expect(b.sample()).toBe(5);
    expect(() => fire(99)).toThrow("nope");
    expect(b.sample()).toBe(5); // 99 never committed
    fire(7);
    expect(b.sample()).toBe(7);
  });

  test("one throwing observer does not stop the others (isolation)", () => {
    const [e, fire] = newEvent<number>();
    const seen: number[] = [];
    e.listen(() => {
      throw new Error("obs1");
    });
    e.listen((v) => seen.push(v));

    expect(() => fire(1)).toThrow("obs1");
    expect(seen).toEqual([1]); // second observer still ran
  });
});
