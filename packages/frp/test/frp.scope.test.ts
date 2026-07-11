// Phase 2 of REFACTOR-PLAN: the ownership Scope lives in the core. State and
// effects get a declared lifetime; the dom package builds its component
// owners on top of this class.
import { describe, test, expect } from "vitest";
import { Scope, getScope, runInScope, root } from "@continuum-js/frp";

describe("Scope — ownership in the core", () => {
  test("root() provides an ambient scope and a dispose handle", () => {
    const order: string[] = [];
    root((dispose) => {
      const s = getScope();
      expect(s).toBeInstanceOf(Scope);
      s!.onDispose(() => order.push("cleanup"));
      dispose();
    });
    expect(order).toEqual(["cleanup"]);
    expect(getScope()).toBeNull(); // ambient restored
  });

  test("children dispose before the parent, both in reverse creation order", () => {
    const order: string[] = [];
    root((dispose) => {
      const parent = getScope()!;
      parent.onDispose(() => order.push("parent-1"));
      const a = new Scope();
      a.onDispose(() => order.push("child-a"));
      const b = new Scope();
      b.onDispose(() => order.push("child-b"));
      parent.onDispose(() => order.push("parent-2"));
      dispose();
    });
    expect(order).toEqual(["child-b", "child-a", "parent-2", "parent-1"]);
  });

  test("dispose is idempotent and detaches from the parent", () => {
    root((dispose) => {
      const child = new Scope();
      let runs = 0;
      child.onDispose(() => runs++);
      child.dispose();
      child.dispose();
      expect(runs).toBe(1);
      dispose(); // must not re-run the child's cleanups
      expect(runs).toBe(1);
    });
  });

  test("runInScope sets and restores the ambient scope, even on throw", () => {
    const s = new Scope(null);
    expect(() =>
      runInScope(s, () => {
        expect(getScope()).toBe(s);
        throw new Error("x");
      }),
    ).toThrow("x");
    expect(getScope()).toBeNull();
  });

  test("a scope created under an ambient parent attaches to it by default", () => {
    const order: string[] = [];
    root((dispose) => {
      runInScope(getScope(), () => {
        const nested = new Scope(); // parent defaults to the ambient scope
        nested.onDispose(() => order.push("nested"));
      });
      dispose();
    });
    expect(order).toEqual(["nested"]);
  });
});
