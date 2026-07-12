// Lifecycle functions outside any owner used to be silent no-ops: an
// onCleanup registered from a setTimeout or event handler simply never ran.
// Now they throw a teaching error. The internal JSX bindings keep their old
// unowned behavior (building JSX outside mount stays possible).
import { describe, test, expect } from "vitest";
import {
  onCleanup,
  onMount,
  provide,
  use,
  createContext,
  root,
} from "@continuum-js/dom";
import { state } from "@continuum-js/frp";

describe("lifecycle functions outside any owner throw", () => {
  test("onCleanup", () => {
    expect(() => onCleanup(() => {})).toThrow(/outside/i);
  });

  test("onMount", () => {
    expect(() => onMount(() => {})).toThrow(/outside/i);
  });

  test("provide", () => {
    const ctx = createContext("light");
    expect(() => provide(ctx, "dark")).toThrow(/outside/i);
  });

  test("the handler-registered-too-late case reads like a lesson", () => {
    expect(() => onCleanup(() => {})).toThrow(/component|scope/i);
  });
});

describe("owned code keeps working", () => {
  test("onCleanup/onMount/provide inside root()", () => {
    const ctx = createContext("light");
    let cleaned = false;
    root((dispose) => {
      onCleanup(() => (cleaned = true));
      onMount(() => {});
      provide(ctx, "dark");
      expect(use(ctx)).toBe("dark");
      dispose();
    });
    expect(cleaned).toBe(true);
  });

  test("use() outside an owner still returns the default (a read, not a leak)", () => {
    const ctx = createContext("fallback");
    expect(use(ctx)).toBe("fallback");
  });

  test("building JSX with live bindings outside mount stays allowed", () => {
    const b = state(0);
    expect(() => <div>{b}</div>).not.toThrow();
  });
});
