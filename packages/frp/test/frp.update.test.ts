// state().update(f) — the read-modify-write escape hatch. Unlike
// `set(sample() + 1)`, the updater folds over the PENDING value (the one
// staged this very moment), so several updates inside one batch compose
// instead of all reading the stale pre-moment value.
import { describe, test, expect } from "vitest";
import { state, batch } from "@continuum-js/frp";

describe("state().update()", () => {
  test("updates from the current value", () => {
    const count = state(1);
    count.update((n) => n + 1);
    expect(count.sample()).toBe(2);
  });

  test("two updates in ONE batch compose (+2, not +1)", () => {
    const count = state(0);
    batch(() => {
      count.update((n) => n + 1);
      count.update((n) => n + 1);
    });
    expect(count.sample()).toBe(2);
    // the anti-pattern this replaces: set(sample() + 1) reads the committed
    // (pre-moment) value twice and loses an increment
    const naive = state(0);
    batch(() => {
      naive.set(naive.sample() + 1);
      naive.set(naive.sample() + 1);
    });
    expect(naive.sample()).toBe(1); // documented hold-delay behavior
  });

  test("update mixes with set inside a batch, last-write-wins per field", () => {
    const count = state(10);
    batch(() => {
      count.set(100);
      count.update((n) => n + 1); // sees the staged 100
    });
    expect(count.sample()).toBe(101);
  });

  test("an identity update is an equality-skip no-op", () => {
    const count = state(5);
    const seen: number[] = [];
    count.listen((v) => seen.push(v));
    count.update((n) => n); // same value -> no moment
    expect(seen).toEqual([5]);
  });

  test("subscribers see ONE coalesced occurrence per moment", () => {
    const count = state(0);
    const seen: number[] = [];
    count.listen((v) => seen.push(v));
    batch(() => {
      count.update((n) => n + 1);
      count.update((n) => n * 10);
    });
    expect(seen).toEqual([0, 10]); // (0+1)*10, delivered once
  });

  test("a function-valued state is unambiguous: set takes values, update takes updaters", () => {
    const handler = state<() => string>(() => "a");
    handler.set(() => "b"); // a new VALUE (itself a function)
    expect(handler.sample()()).toBe("b");
    handler.update((prev) => () => prev() + "!"); // an UPDATER returning a function
    expect(handler.sample()()).toBe("b!");
  });
});
