// The 1.0 surface freeze: every deprecated alias and theory-flavored form
// is GONE. One name per concept — the migration guide maps the old ones.
import { describe, test, expect } from "vitest";
import * as frp from "@continuum-js/frp";
import {
  state,
  stream,
  State,
  Stream,
  combine,
  flatten,
  root,
} from "@continuum-js/frp";

describe("1.0 surface — removed aliases", () => {
  test("the rename-era aliases are gone", () => {
    for (const name of [
      "Event",
      "newEvent",
      "Behavior",
      "Wire",
      "wire",
      "newBehavior",
    ]) {
      expect(name in frp, `${name} must be removed`).toBe(false);
    }
  });

  test("theory-flavored statics are gone from State", () => {
    for (const name of ["apply", "lift2", "lift3", "switchB", "switchE"]) {
      // own-property check: `"apply" in State` would hit Function.prototype
      expect(
        Object.prototype.hasOwnProperty.call(State, name),
        `State.${name} must be removed (use combine/flatten)`,
      ).toBe(false);
    }
  });

  test("deprecated Stream methods are gone", () => {
    const s = stream<number>();
    for (const name of ["snapshot", "gate", "orElse"]) {
      expect(
        (s as unknown as Record<string, unknown>)[name],
        `Stream.${name} must be removed`,
      ).toBeUndefined();
    }
  });

  test("the survivors still work end to end", () => {
    root(() => {
      const a = state(1);
      const b = state(2);
      const sum = combine(a, b, (x, y) => x + y);
      expect(sum.sample()).toBe(3);

      const chosen = state<State<number>>(a);
      const flat = flatten(chosen);
      expect(flat.sample()).toBe(1);

      const clicks = stream<number>();
      const gated = clicks.when(state(true));
      const merged = gated.or(clicks.map((x) => x * 10));
      const seen: number[] = [];
      merged.listen((v) => seen.push(v));
      clicks.fire(7);
      expect(seen).toEqual([7]); // left-biased on simultaneity

      const at = a.at(clicks, (value, ev) => value + ev);
      expect(at instanceof Stream).toBe(true);
    });
  });
});
