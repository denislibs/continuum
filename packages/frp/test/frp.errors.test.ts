import { describe, test, expect } from "vitest";
import {
  root,
  newStream,
  state,
  combine,
  flatten,
  constant,
  type State,
} from "@continuum-js/frp";

describe("error semantics (§5.1 + isolation)", () => {
  test("exception in a combinator propagates but the engine recovers", () => {
    const [e, fire] = newStream<number>();
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
    const [e, fire] = newStream<number>();
    // hold fed by a mapping that throws on 99
    const mapped = e.map((n) => {
      if (n === 99) throw new Error("nope");
      return n;
    });
    const b = root(() => mapped.hold(0));
    fire(5);
    expect(b.sample()).toBe(5);
    expect(() => fire(99)).toThrow("nope");
    expect(b.sample()).toBe(5); // 99 never committed
    fire(7);
    expect(b.sample()).toBe(7);
  });

  test("one throwing observer does not stop the others (isolation)", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    e.listen(() => {
      throw new Error("obs1");
    });
    e.listen((v) => seen.push(v));

    expect(() => fire(1)).toThrow("obs1");
    expect(seen).toEqual([1]); // second observer still ran
  });

  // #113: a combine woken mid-moment defers a reseed; if that moment aborts
  // before the reseed runs, the join must not go permanently silent.
  test("combine survives an aborted waking moment (#113)", () => {
    root(() => {
      const a = state(1);
      const b = state(1);
      const c = combine(a, b, (x, y) => x + y); // cold, value 2

      const sel = state<State<number>>(constant(0));
      const flat = flatten(sel);
      let poison = false;
      const guarded = flat.map((v) => {
        if (poison) throw new Error("boom");
        return v;
      });
      guarded.listen(() => {}); // wake flat + chain

      // Switch flat onto c AND poison, so the switch's phase-2 emission throws
      // — aborting the moment after c.onWake ran but before its reseed reset.
      poison = true;
      expect(() => sel.set(c)).toThrow("boom");
      poison = false;

      // On the buggy version `reseeding` was stranded true and c.updates never
      // fired again; the fix keys it to the (never-recycled) aborted moment.
      const seen: number[] = [];
      c.updates.listen((v) => seen.push(v));
      a.set(10);
      expect(seen).toEqual([11]);
    });
  });
});
