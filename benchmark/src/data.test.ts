import { describe, test, expect } from "vitest";
import { buildLabel, swap, seededRandom } from "./data";

describe("benchmark data helpers", () => {
  test("buildLabel composes adjective + colour + noun", () => {
    // A deterministic rng always picking the first entry.
    const label = buildLabel(() => 0);
    expect(label).toBe("pretty red table");
  });

  test("buildLabel is deterministic under a seeded rng", () => {
    const a = buildLabel(seededRandom(42));
    const b = buildLabel(seededRandom(42));
    expect(a).toBe(b);
    expect(a.split(" ")).toHaveLength(3);
  });

  test("swap returns a new array with two positions exchanged", () => {
    const arr = [0, 1, 2, 3, 4];
    const out = swap(arr, 1, 3);
    expect(out).toEqual([0, 3, 2, 1, 4]);
    expect(arr).toEqual([0, 1, 2, 3, 4]); // original untouched
    expect(out).not.toBe(arr);
  });

  test("swap is a no-op when an index is out of range", () => {
    const arr = [0, 1];
    expect(swap(arr, 1, 998)).toBe(arr);
  });
});
