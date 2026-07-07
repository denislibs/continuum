// Dev-guard for the purity contract: firing a source from inside a pure
// combinator callback (map/filter/snapshot/accum/lift) used to silently join
// the moment being computed — half the graph already drained, updates lost or
// reordered. Now it throws a teaching error. Effects belong at the boundary:
// handlers, `listen` (post phase), `perform`.
import { describe, test, expect } from "vitest";
import {
  newEvent,
  newBehavior,
  Behavior,
  Transaction,
} from "@continuum-js/frp";

describe("firing a source inside a pure combinator throws", () => {
  test("inside a map callback", () => {
    const [other, fireOther] = newEvent<number>();
    other.listen(() => {});

    const [b, set] = newBehavior(0);
    const bad = b.map((n) => {
      if (n > 0) fireOther(n); // side effect in a pure zone
      return n;
    });
    const un = bad.listen(() => {});

    expect(() => set(1)).toThrow(/pure combinator/i);
    un();
  });

  test("inside an accum reducer", () => {
    const [echo, fireEcho] = newEvent<number>();
    echo.listen(() => {});

    const [src, fire] = newEvent<number>();
    const acc = src.accum(0, (a, n) => {
      fireEcho(a);
      return n + a;
    });
    const un = acc.updates.listen(() => {});

    expect(() => fire(1)).toThrow(/pure combinator/i);
    un();
  });

  test("inside a filter predicate", () => {
    const [other, fireOther] = newEvent<number>();
    other.listen(() => {});

    const [src, fire] = newEvent<number>();
    const un = src
      .filter((n) => {
        fireOther(n);
        return true;
      })
      .listen(() => {});

    expect(() => fire(1)).toThrow(/pure combinator/i);
    un();
  });

  test("inside a snapshot combine function", () => {
    const [other, fireOther] = newEvent<number>();
    other.listen(() => {});

    const [src, fire] = newEvent<number>();
    const held = src.hold(0);
    const un = src
      .snapshot(held, (now, prev) => {
        fireOther(now);
        return now + prev;
      })
      .listen(() => {});

    expect(() => fire(1)).toThrow(/pure combinator/i);
    un();
  });
});

describe("legitimate effect sites keep working", () => {
  test("set from a post-phase listener opens a fresh moment", () => {
    const [a, setA] = newBehavior(0);
    const [b, setB] = newBehavior(0);

    // the boundary pattern: react to one value by setting another
    const seen: number[] = [];
    const unA = a.listen((v) => {
      if (v > 0) setB(v * 10);
    });
    const unB = b.listen((v) => seen.push(v));

    expect(() => setA(1)).not.toThrow();
    expect(seen).toEqual([0, 10]); // initial delivery, then the new moment
    unA();
    unB();
  });

  test("batching several sets in one Transaction.run body stays atomic", () => {
    const [a, setA] = newBehavior(0);
    const [b, setB] = newBehavior(0);
    const joined = Behavior.lift2((x, y) => [x, y] as const, a, b);
    const seen: Array<readonly [number, number]> = [];
    const un = joined.updates.listen((p) => seen.push(p));

    expect(() =>
      Transaction.run(() => {
        setA(1);
        setB(2);
      }),
    ).not.toThrow();

    // one moment, one consistent delivery — never [1, 0]
    expect(seen).toEqual([[1, 2]]);
    un();
  });
});
