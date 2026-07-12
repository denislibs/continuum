// The State rename (the Event → Stream / Behavior → Wire playbook, third and
// last): `Wire` read as nothing to anyone outside this repo, `state` is the
// word every React/Vue/Svelte person already thinks in. Old names stay as
// deprecated aliases until 1.0.
import { describe, test, expect } from "vitest";
import {
  State,
  state,
  Stream,
  Wire,
  wire,
  Behavior,
  constant,
} from "@continuum-js/frp";
import type { StateSource, WireSource } from "@continuum-js/frp";

describe("State — the type rename", () => {
  test("State is the class; Wire and Behavior are the same class under deprecated aliases", () => {
    expect(Wire).toBe(State);
    expect(Behavior).toBe(State);
    expect(constant(1) instanceof State).toBe(true);
  });

  test("state(init) is a source cell with .set/.update", () => {
    const count = state(0);
    expect(count instanceof State).toBe(true);
    expect(count.sample()).toBe(0);
    count.set(5);
    expect(count.sample()).toBe(5);
    count.update((n) => n + 1);
    expect(count.sample()).toBe(6);
  });

  test("wire === state (the deprecated factory alias)", () => {
    expect(wire).toBe(state);
  });

  test("a StateSource is assignable where a WireSource is expected", () => {
    // type-level: the aliases must stay interchangeable until 1.0
    const s: StateSource<number> = state(0);
    const w: WireSource<number> = s;
    w.set(1);
    expect(s.sample()).toBe(1);
  });

  test("derived states are States too", () => {
    const count = state(2);
    const doubled = count.map((x) => x * 2);
    expect(doubled instanceof State).toBe(true);
    expect(doubled.sample()).toBe(4);
    expect(doubled.updates instanceof Stream).toBe(true);
  });
});
