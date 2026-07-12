// selector(): keyed selection with O(2) updates — ONE process watches the
// wire, each key gets a tiny cell that flips only when the selection enters
// or leaves it. 10k rows no longer mean 10k map nodes over `selected` and
// 10k recomputes per click.
import { describe, test, expect } from "vitest";
import { wire, selector, root } from "@continuum-js/frp";

describe("selector", () => {
  test("flips exactly the two affected keys", () => {
    root(() => {
      const selected = wire<number | null>(null);
      const isSel = selector(selected);
      const deliveries: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      for (const k of [1, 2, 3]) {
        isSel(k).listen(() => deliveries[k]++);
      }
      expect(deliveries).toEqual({ 1: 1, 2: 1, 3: 1 }); // initial only
      selected.set(2);
      expect(deliveries).toEqual({ 1: 1, 2: 2, 3: 1 }); // one flip
      selected.set(3);
      expect(deliveries).toEqual({ 1: 1, 2: 3, 3: 2 }); // leave 2, enter 3
      expect(isSel(3).sample()).toBe(true);
      expect(isSel(2).sample()).toBe(false);
    });
  });

  test("a key requested after selection reflects the current state", () => {
    root(() => {
      const selected = wire(7);
      const isSel = selector(selected);
      expect(isSel(7).sample()).toBe(true);
      expect(isSel(8).sample()).toBe(false);
    });
  });

  test("value form: selector(w, on, off) yields ready-to-bind values", () => {
    root(() => {
      const selected = wire<number | null>(null);
      const cls = selector(selected, "danger", "");
      expect(cls(1).sample()).toBe("");
      selected.set(1);
      expect(cls(1).sample()).toBe("danger");
      selected.set(2);
      expect(cls(1).sample()).toBe("");
      expect(cls(2).sample()).toBe("danger");
    });
  });

  test("both flips share ONE moment (no in-between state)", () => {
    root(() => {
      const selected = wire(1);
      const isSel = selector(selected);
      const one = isSel(1);
      const two = isSel(2);
      const pairs: Array<[boolean, boolean]> = [];
      one.updates.listen(() => pairs.push([one.sample(), two.sample()]));
      selected.set(2);
      // post-phase read: both already committed — never (false,false)/(true,true)
      expect(pairs).toEqual([[false, true]]);
    });
  });

  test("dies with its scope; outside a scope it teaches", () => {
    const selected = wire(1);
    expect(() => selector(selected)).toThrow(/scope|root\(\)/);
    let isSel!: (k: number) => { sample(): boolean };
    root((dispose) => {
      isSel = selector(selected);
      dispose();
    });
    selected.set(5);
    expect(isSel(5).sample()).toBe(false); // frozen: the process is dead
  });
});
