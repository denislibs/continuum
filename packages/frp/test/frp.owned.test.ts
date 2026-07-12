// Phase 3 of REFACTOR-PLAN: state and effects belong to a scope. hold/accum
// are sugar over "cell + process registered in the ambient scope"; the
// dispose-cascade and the reaper are gone — nothing guesses liveness.
import { describe, test, expect } from "vitest";
import {
  state,
  stream,
  root,
  batch,
  newStream,
  perform,
} from "@continuum-js/frp";

describe("owned state — hold/accum live with their scope, not their listeners", () => {
  test("a hold survives listener churn: sample stays live, re-listen works", () => {
    root(() => {
      const src = stream<number>();
      const held = src.hold(0);
      const un = held.listen(() => {});
      src.fire(1);
      un();
      src.fire(2); // no listeners — state still tracks history
      expect(held.sample()).toBe(2);
      const seen: number[] = [];
      held.listen((v) => seen.push(v)); // remount: no "disposed" trap
      src.fire(3);
      expect(seen).toEqual([2, 3]);
    });
  });

  test("an accum keeps counting across unlisten (the frozen-counter bug)", () => {
    root(() => {
      const clicks = stream<null>();
      const count = clicks.accum(0, (_e, n) => n + 1);
      clicks.fire(null);
      const un = count.listen(() => {});
      clicks.fire(null);
      un();
      clicks.fire(null);
      expect(count.sample()).toBe(3);
    });
  });

  test("scope dispose detaches the process: the source pays nothing afterwards", () => {
    const src = stream<number>();
    let calls = 0;
    let held!: ReturnType<typeof src.hold>;
    root((dispose) => {
      held = src
        .map((x) => {
          calls++;
          return x;
        })
        .hold(0);
      src.fire(1);
      expect(calls).toBe(1);
      dispose();
    });
    src.fire(2);
    expect(calls).toBe(1); // detached with the scope
    expect(held.sample()).toBe(1); // frozen at the scope's end — deterministic
  });

  test("hold/accum outside any scope throw a teaching error", () => {
    const src = stream<number>();
    expect(() => src.hold(0)).toThrow(/scope|root\(\)/);
    expect(() => src.accum(0, (a: number, n: number) => n + a)).toThrow(
      /scope|root\(\)/,
    );
  });
});

describe("state().on() — declarative state transitions", () => {
  test("a counter reads as a spec", () => {
    root(() => {
      const inc = stream<null>();
      const dec = stream<null>();
      const reset = stream<null>();
      const count = state(0)
        .on(inc, (n) => n + 1)
        .on(dec, (n) => n - 1)
        .on(reset, () => 0);
      inc.fire(null);
      inc.fire(null);
      dec.fire(null);
      expect(count.sample()).toBe(1);
      reset.fire(null);
      expect(count.sample()).toBe(0);
    });
  });

  test("the reducer receives (state, event)", () => {
    root(() => {
      const add = stream<number>();
      const total = state(10).on(add, (n, x) => n + x);
      add.fire(5);
      expect(total.sample()).toBe(15);
    });
  });

  test("an occurrence and the state's update share ONE moment (snapshot sees the past)", () => {
    root(() => {
      const clicks = stream<null>();
      const count = state(0).on(clicks, (n) => n + 1);
      const before = count.at(clicks);
      const seen: number[] = [];
      before.listen((v) => seen.push(v));
      clicks.fire(null);
      clicks.fire(null);
      expect(seen).toEqual([0, 1]); // the value BEFORE each moment
      expect(count.sample()).toBe(2);
    });
  });

  test("two streams in one batch fold sequentially over the staged value", () => {
    root(() => {
      const a = stream<null>();
      const b = stream<null>();
      const n = state(0)
        .on(a, (x) => x + 1)
        .on(b, (x) => x * 10);
      const un = n.listen(() => {});
      // both fire in one moment: folds compose instead of clobbering
      batch(() => {
        a.fire(null);
        b.fire(null);
      });
      expect(n.sample()).toBe(10); // (0 + 1) * 10
      un();
    });
  });

  test(".on outside any scope throws the teaching error", () => {
    const clicks = stream<null>();
    expect(() => state(0).on(clicks, (n) => n + 1)).toThrow(/scope|root\(\)/);
  });
});

describe("owned effects — perform stops with its scope", () => {
  test("in-flight results after scope dispose are dropped", async () => {
    const req = stream<number>();
    let resolveIt!: (v: number) => void;
    const seen: unknown[] = [];
    root((dispose) => {
      const res = perform(
        req,
        () => new Promise<number>((r) => (resolveIt = r)),
      );
      res.listen((r) => seen.push(r));
      req.fire(1);
      dispose();
    });
    resolveIt(42);
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual([]); // the effect died with its owner
  });

  test("perform outside any scope throws the teaching error", () => {
    const [e] = newStream<number>();
    expect(() => perform(e, async (x) => x)).toThrow(/scope|root\(\)/);
  });
});

describe("the guards are gone", () => {
  test("explicit dispose() still kills a node, with an honest error", () => {
    root(() => {
      const src = stream<number>();
      const m = src.map((x) => x);
      m.listen(() => {});
      m.dispose();
      expect(() => m.listen(() => {})).toThrow(/dispose/);
    });
  });

  test("a pure derivation still sleeps and wakes across listener churn", () => {
    const src = stream<number>();
    let calls = 0;
    const m = src.map((x) => {
      calls++;
      return x;
    });
    const un = m.listen(() => {});
    src.fire(1);
    un();
    src.fire(2);
    expect(calls).toBe(1); // asleep
    m.listen(() => {});
    src.fire(3);
    expect(calls).toBe(2); // woke again — no cascade killed it
  });
});
