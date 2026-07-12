import { describe, test, expect } from "vitest";
import { root, newStream, Stream, state } from "@continuum-js/frp";

describe("accumulation", () => {
  test("accum folds occurrences into a behavior", () => {
    const [e, fire] = newStream<number>();
    const sum = root(() => e.accum(0, (a, s) => s + a));
    expect(sum.sample()).toBe(0);
    fire(3);
    expect(sum.sample()).toBe(3);
    fire(4);
    expect(sum.sample()).toBe(7);
  });

  test("accumE emits the stream of accumulated states", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    root(() => e.accumE(0, (a, s) => s + a)).listen((v) => seen.push(v));
    fire(1);
    fire(2);
    fire(3);
    expect(seen).toEqual([1, 3, 6]);
  });
});

describe("once", () => {
  test("only the first occurrence passes", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    e.once().listen((v) => seen.push(v));
    fire(10);
    fire(20);
    fire(30);
    expect(seen).toEqual([10]);
  });
});

describe("gate", () => {
  test("passes only while the behavior is true", () => {
    const [e, fire] = newStream<number>();
    const open = state(true);
    const setOpen = open.set;
    const seen: number[] = [];
    e.when(open).listen((v) => seen.push(v));
    fire(1);
    setOpen(false);
    fire(2);
    setOpen(true);
    fire(3);
    expect(seen).toEqual([1, 3]);
  });
});

describe("orElse (left-biased merge)", () => {
  test("independent occurrences all pass through", () => {
    const [a, fireA] = newStream<number>();
    const [b, fireB] = newStream<number>();
    const seen: number[] = [];
    a.or(b).listen((v) => seen.push(v));
    fireA(1);
    fireB(2);
    expect(seen).toEqual([1, 2]);
  });

  test("simultaneous occurrences prefer the left", () => {
    const [src, fire] = newStream<number>();
    const left = src.map((n) => n + 100);
    const right = src.map((n) => n + 200);
    const seen: number[] = [];
    left.or(right).listen((v) => seen.push(v));
    fire(1); // both branches fire in one moment; left wins
    expect(seen).toEqual([101]);
  });
});

describe("merge with coalescing", () => {
  test("simultaneous occurrences coalesce once via the combiner", () => {
    const [src, fire] = newStream<number>();
    const left = src.map((n) => n * 1);
    const right = src.map((n) => n * 10);
    const seen: number[] = [];
    Stream.merge(left, right, (l, r) => l + r).listen((v) => seen.push(v));
    fire(1); // left=1, right=10 in one moment -> single coalesced 11
    fire(2); // left=2, right=20 -> 22
    expect(seen).toEqual([11, 22]);
  });
});

describe("glitch-free diamond", () => {
  test("a diamond emits one consistent value, no intermediate glitch", () => {
    const [src, fire] = newStream<number>();
    // one source -> two derived paths -> merge
    const a = src.map((n) => n);
    const b = src.map((n) => n).map((n) => n);
    const seen: number[] = [];
    Stream.merge(a, b, (x, y) => x + y).listen((v) => seen.push(v));
    fire(5);
    // Both branches fire in one moment; a single coalesced 10 is observed,
    // never a half-updated intermediate.
    expect(seen).toEqual([10]);
  });
});
