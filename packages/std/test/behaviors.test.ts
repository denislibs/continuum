import { describe, test, expect } from "vitest";
import { root, newBehavior } from "@continuum-js/frp";
import { previous, distinctB } from "@continuum-js/std";

describe("behavior combinators", () => {
  test("previous lags one step behind", () => {
    const [b, setB] = newBehavior(0);
    const prev = root(() => previous(b, -1));
    expect(prev.sample()).toBe(-1);

    setB(5);
    expect(prev.sample()).toBe(0); // value b held before

    setB(9);
    expect(prev.sample()).toBe(5);
  });

  test("distinctB suppresses updates that don't change the value", () => {
    const [b, setB] = newBehavior(1);
    const seen: number[] = [];
    const d = distinctB(b);
    d.updates.listen((v) => seen.push(v));

    setB(1); // same value — suppressed
    setB(2); // change — emitted
    setB(2); // same — suppressed
    setB(3); // change — emitted
    expect(seen).toEqual([2, 3]);
  });

  test("distinctB honours a custom equality", () => {
    const [b, setB] = newBehavior({ id: 1 });
    const seen: number[] = [];
    const d = distinctB(b, (x, y) => x.id === y.id);
    d.updates.listen((v) => seen.push(v.id));

    setB({ id: 1 }); // equal by id — suppressed
    setB({ id: 2 }); // different id — emitted
    expect(seen).toEqual([2]);
  });
});
