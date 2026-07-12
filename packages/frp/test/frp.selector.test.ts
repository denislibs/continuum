// selector(): keyed selection with O(2) updates — ONE process watches the
// state, each key gets a tiny cell that flips only when the selection enters
// or leaves it. 10k rows no longer mean 10k map nodes over `selected` and
// 10k recomputes per click.
import { describe, test, expect } from "vitest";
import { state, selector, root } from "@continuum-js/frp";

describe("selector", () => {
  test("flips exactly the two affected keys", () => {
    root(() => {
      const selected = state<number | null>(null);
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
      const selected = state(7);
      const isSel = selector(selected);
      expect(isSel(7).sample()).toBe(true);
      expect(isSel(8).sample()).toBe(false);
    });
  });

  test("value form: selector(w, on, off) yields ready-to-bind values", () => {
    root(() => {
      const selected = state<number | null>(null);
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
      const selected = state(1);
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

  // Eviction: a cell nobody listens to must not be retained — 10k rows
  // cleared used to leave 10k cells (≈2.9 MB) in the Map forever. A fresh
  // request after eviction reseeds from the current selection, so the only
  // observable trace is state identity.
  test("evicts a cell once its last listener detaches", () => {
    root(() => {
      const selected = state<number | null>(null);
      const isSel = selector(selected);
      const w1 = isSel(1);
      const un1 = w1.listen(() => {});
      const un2 = w1.listen(() => {});
      expect(isSel(1)).toBe(w1); // alive while listened
      un1();
      expect(isSel(1)).toBe(w1); // still one listener left
      un2();
      const w2 = isSel(1);
      expect(w2).not.toBe(w1); // evicted → a fresh cell
      expect(w2.sample()).toBe(false); // reseeded from the current selection
      selected.set(1);
      expect(isSel(1).sample()).toBe(true); // the fresh cell still flips
    });
  });

  test("an evicted cell for the SELECTED key reseeds as true", () => {
    root(() => {
      const selected = state(2);
      const isSel = selector(selected);
      const un = isSel(2).listen(() => {});
      un(); // evict
      expect(isSel(2).sample()).toBe(true); // key === current selection
      selected.set(3);
      expect(isSel(2).sample()).toBe(false);
      expect(isSel(3).sample()).toBe(true);
    });
  });

  test("dies with its scope; outside a scope it teaches", () => {
    const selected = state(1);
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
