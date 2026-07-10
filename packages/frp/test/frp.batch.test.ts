import { describe, test, expect } from "vitest";
import {
  newStream,
  newBehavior,
  Behavior,
  Stream,
  batch,
} from "@continuum-js/frp";

describe("batch — several fires as one moment", () => {
  test("two sets inside one batch reach a lift2 as ONE recomputation", () => {
    const [a, setA] = newBehavior(1);
    const [b, setB] = newBehavior(10);
    let computes = 0;
    const sum = Behavior.lift2(
      (x, y) => {
        computes++;
        return x + y;
      },
      a,
      b,
    );
    const seen: number[] = [];
    sum.listen((v) => seen.push(v));
    computes = 0;

    batch(() => {
      setA(2);
      setB(20);
    });

    // without batch this would be two moments: [11, 21, 22]
    expect(seen).toEqual([11, 22]);
    expect(computes).toBe(1);
  });

  test("merge coalesces occurrences fired in one batch", () => {
    const [ea, fireA] = newStream<number>();
    const [eb, fireB] = newStream<number>();
    const m = Stream.merge(ea, eb, (l, r) => l + r);
    const seen: number[] = [];
    m.listen((v) => seen.push(v));

    batch(() => {
      fireA(1);
      fireB(2);
    });

    expect(seen).toEqual([3]);
  });

  test("returns the callback's value", () => {
    expect(batch(() => 42)).toBe(42);
  });

  test("nested batch joins the enclosing moment", () => {
    const [a, setA] = newBehavior(1);
    const [b, setB] = newBehavior(1);
    const sum = Behavior.lift2((x, y) => x + y, a, b);
    const seen: number[] = [];
    sum.listen((v) => seen.push(v));

    batch(() => {
      setA(2);
      batch(() => setB(3));
    });

    expect(seen).toEqual([2, 5]);
  });

  test("observers run after the batch closes and see committed state", () => {
    const [a, setA] = newBehavior(0);
    const [e, fire] = newStream<number>();
    let sampledInsideObserver = -1;
    e.listen(() => {
      sampledInsideObserver = a.sample();
    });

    batch(() => {
      fire(1);
      setA(7); // same moment: the observer must still see 7, not 0
    });

    expect(sampledInsideObserver).toBe(7);
  });

  test("the purity guard still bites inside a batch", () => {
    const [e, fire] = newStream<number>();
    const [, fireOther] = newStream<number>();
    const bad = e.map((x) => {
      fireOther(1); // side effect in the pure zone
      return x;
    });
    bad.listen(() => {});
    expect(() => batch(() => fire(1))).toThrow(/pure/i);
  });
});
