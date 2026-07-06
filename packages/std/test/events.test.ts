import { describe, test, expect } from "vitest";
import { newEvent } from "@continuum/frp";
import { filterMap, pairwise, partition, count, sampleWith } from "@continuum/std";
import { newBehavior } from "@continuum/frp";

describe("event combinators", () => {
  test("filterMap maps and drops null/undefined results", () => {
    const [e, fire] = newEvent<string>();
    const seen: number[] = [];
    filterMap(e, (s) => {
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    }).listen((n) => seen.push(n));

    fire("1");
    fire("nope");
    fire("3");
    expect(seen).toEqual([1, 3]);
  });

  test("pairwise emits [prev, curr] starting from the second occurrence", () => {
    const [e, fire] = newEvent<number>();
    const seen: Array<[number, number]> = [];
    pairwise(e).listen((p) => seen.push(p));

    fire(1);
    fire(2);
    fire(3);
    expect(seen).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });

  test("partition splits into matching and non-matching streams", () => {
    const [e, fire] = newEvent<number>();
    const [evens, odds] = partition(e, (n) => n % 2 === 0);
    const es: number[] = [];
    const os: number[] = [];
    evens.listen((n) => es.push(n));
    odds.listen((n) => os.push(n));

    [1, 2, 3, 4].forEach(fire);
    expect(es).toEqual([2, 4]);
    expect(os).toEqual([1, 3]);
  });

  test("count folds occurrences into a running total", () => {
    const [e, fire] = newEvent<void>();
    const c = count(e);
    expect(c.sample()).toBe(0);
    fire();
    fire();
    expect(c.sample()).toBe(2);
  });

  test("sampleWith reads the behavior's value at each trigger", () => {
    const [b, setB] = newBehavior("a");
    const [trigger, fire] = newEvent<void>();
    const seen: string[] = [];
    sampleWith(trigger, b).listen((v) => seen.push(v));

    fire();
    setB("b");
    fire();
    expect(seen).toEqual(["a", "b"]);
  });
});
