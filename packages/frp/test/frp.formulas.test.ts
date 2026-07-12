// Phase 4 of REFACTOR-PLAN: the remaining eager middles become formulas.
// distinct/once/merge/flatten are recipes — attached on demand, detached
// after the last listener. Small memories are scoped to a warm period
// (distinct) or observably consistent across sleep (once's fired flag).
import { describe, test, expect } from "vitest";
import {
  stream,
  state,
  distinct,
  flatten,
  Stream,
  State,
} from "@continuum-js/frp";

describe("merge is a formula", () => {
  test("a cold merge never touches its inputs", () => {
    const a = stream<number>();
    const b = stream<number>();
    let calls = 0;
    const counted = a.map((x) => {
      calls++;
      return x;
    });
    Stream.merge(counted, b, (l, r) => l + r);
    a.fire(1);
    expect(calls).toBe(0); // recipe: nothing attached
  });

  test("merge wakes, coalesces, sleeps, and wakes again", () => {
    const a = stream<number>();
    const b = stream<number>();
    const m = Stream.merge(a, b, (l, r) => l + r);
    const seen: number[] = [];
    const un = m.listen((v) => seen.push(v));
    a.fire(1);
    expect(seen).toEqual([1]);
    un();
    a.fire(99); // asleep
    expect(seen).toEqual([1]);
    m.listen((v) => seen.push(v));
    b.fire(2);
    expect(seen).toEqual([1, 2]);
  });
});

describe("distinct is a formula with per-warm-period memory", () => {
  test("cold distinct costs nothing", () => {
    const src = stream<number>();
    let calls = 0;
    distinct(
      src.map((x) => {
        calls++;
        return x;
      }),
    );
    src.fire(1);
    expect(calls).toBe(0);
  });

  test("deduplicates while warm; memory resets across a sleep", () => {
    const src = stream<number>();
    const d = distinct(src);
    const seen: number[] = [];
    const un = d.listen((v) => seen.push(v));
    src.fire(1);
    src.fire(1);
    src.fire(2);
    expect(seen).toEqual([1, 2]);
    un(); // sleeps: the one-value memory belongs to the warm period
    const seen2: number[] = [];
    d.listen((v) => seen2.push(v));
    src.fire(2); // same as the last delivered before the sleep
    expect(seen2).toEqual([2]); // fresh period: it passes
  });
});

describe("once is a formula with a persistent (observation-consistent) flag", () => {
  test("cold: the first occurrence nobody saw leaves it armed", () => {
    const src = stream<number>();
    const o = src.once();
    src.fire(1); // unobserved — did not "use up" the once
    const seen: number[] = [];
    o.listen((v) => seen.push(v));
    src.fire(2);
    expect(seen).toEqual([2]);
  });

  test("after firing while warm it never fires again, even across sleep", () => {
    const src = stream<number>();
    const o = src.once();
    const seen: number[] = [];
    const un = o.listen((v) => seen.push(v));
    src.fire(1);
    expect(seen).toEqual([1]);
    un();
    const seen2: number[] = [];
    o.listen((v) => seen2.push(v));
    src.fire(2);
    expect(seen2).toEqual([]); // spent
  });
});

describe("flatten is a formula", () => {
  test("a cold flatten never attaches to the selection or its inner", () => {
    const a = stream<number>();
    let calls = 0;
    const counted = a.map((x) => {
      calls++;
      return x;
    });
    const sel = state<Stream<number>>(counted);
    flatten(sel);
    a.fire(1);
    expect(calls).toBe(0);
  });

  test("waking attaches the CURRENT selection, even one chosen while asleep", () => {
    const a = stream<number>();
    const b = stream<number>();
    const sel = state<Stream<number>>(a);
    const flat = flatten(sel);
    const seen: number[] = [];
    const un = flat.listen((v) => seen.push(v));
    a.fire(1);
    un(); // asleep
    sel.set(b); // selection changes while nobody watches
    a.fire(99);
    b.fire(98); // both unobserved
    const seen2: number[] = [];
    flat.listen((v) => seen2.push(v)); // wake: must attach b, not a
    b.fire(2);
    a.fire(97);
    expect(seen2).toEqual([2]);
    expect(seen).toEqual([1]);
  });

  test("flatten over states: sample answers cold, push follows warm, sleep detaches the inner", () => {
    const x = state(1);
    const y = state(10);
    let calls = 0;
    const yc = y.map((v) => {
      calls++;
      return v;
    });
    const sel = state<State<number>>(yc);
    const flat = flatten(sel);
    expect(flat.sample()).toBe(10); // pull through, fully cold
    expect(calls).toBe(1); // the pull recompute only
    const seen: number[] = [];
    const un = flat.listen((v) => seen.push(v));
    y.set(20);
    expect(seen).toEqual([10, 20]);
    un(); // sleep: the inner subscription must detach too
    const before = calls;
    y.set(30);
    expect(calls).toBe(before); // yc asleep — no push computation
    sel.set(x);
    expect(flat.sample()).toBe(1); // still answers cold
  });

  test("rewiring while warm keeps working (the classic switch)", () => {
    const a = stream<string>();
    const b = stream<string>();
    const sel = state<Stream<string>>(a);
    const flat = flatten(sel);
    const seen: string[] = [];
    flat.listen((v) => seen.push(v));
    a.fire("a1");
    sel.set(b);
    b.fire("b1");
    a.fire("a2"); // no longer selected
    expect(seen).toEqual(["a1", "b1"]);
  });
});
