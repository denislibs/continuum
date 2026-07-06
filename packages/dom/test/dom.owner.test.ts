import { describe, test, expect } from "vitest";
import { root, scope, onCleanup } from "@continuum/dom";

describe("ownership tree", () => {
  test("scope disposes cleanups in LIFO order", () => {
    const log: string[] = [];
    const { dispose } = scope(() => {
      onCleanup(() => log.push("a"));
      onCleanup(() => log.push("b"));
    });
    expect(log).toEqual([]);
    dispose();
    expect(log).toEqual(["b", "a"]);
  });

  test("children dispose before parent cleanups (recursive LIFO)", () => {
    const log: string[] = [];
    const { dispose } = scope(() => {
      onCleanup(() => log.push("parent-a"));
      scope(() => {
        onCleanup(() => log.push("child"));
      });
      onCleanup(() => log.push("parent-b"));
    });
    dispose();
    // reverse creation order: child owner, then parent cleanups b, a
    expect(log).toEqual(["child", "parent-b", "parent-a"]);
  });

  test("dispose is idempotent", () => {
    const log: string[] = [];
    const { dispose } = scope(() => {
      onCleanup(() => log.push("x"));
    });
    dispose();
    dispose();
    expect(log).toEqual(["x"]);
  });

  test("root gives a dispose handle and returns the value", () => {
    const log: string[] = [];
    let disposeRoot: () => void = () => {};
    const value = root((dispose) => {
      disposeRoot = dispose;
      onCleanup(() => log.push("root"));
      return 42;
    });
    expect(value).toBe(42);
    expect(log).toEqual([]);
    disposeRoot();
    expect(log).toEqual(["root"]);
  });

  test("onCleanup outside any owner is a no-op", () => {
    expect(() => onCleanup(() => {})).not.toThrow();
  });
});
