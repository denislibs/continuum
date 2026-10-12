// The State rename (the Event → Stream / State → State playbook, third and
// last): `State` read as nothing to anyone outside this repo, `state` is the
// word every React/Vue/Svelte person already thinks in. Old names stay as
// deprecated aliases until 1.0.
import { describe, test, expect } from "vitest";
import { State, state, Stream, constant } from "@continuum-js/frp";
import type { StateSource } from "@continuum-js/frp";
import { flushFrame } from "@continuum-js/frp";

describe("State — the type rename", () => {
  test("State is the class; State and State are the same class under deprecated aliases", () => {
    flushFrame();
    expect(State).toBe(State);
    flushFrame();
    expect(State).toBe(State);
    flushFrame();
    expect(constant(1) instanceof State).toBe(true);
  });

  test("state(init) is a source cell with .set/.update", () => {
    const count = state(0);
    flushFrame();
    expect(count instanceof State).toBe(true);
    flushFrame();
    expect(count.sample()).toBe(0);
    count.set(5);
    flushFrame();
    expect(count.sample()).toBe(5);
    count.update((n) => n + 1);
    flushFrame();
    expect(count.sample()).toBe(6);
  });

  test("state === state (the deprecated factory alias)", () => {
    flushFrame();
    expect(state).toBe(state);
  });

  test("a StateSource is assignable where a StateSource is expected", () => {
    // type-level: the aliases must stay interchangeable until 1.0
    const s: StateSource<number> = state(0);
    const w: StateSource<number> = s;
    w.set(1);
    flushFrame();
    expect(s.sample()).toBe(1);
  });

  test("derived states are States too", () => {
    const count = state(2);
    const doubled = count.map((x) => x * 2);
    flushFrame();
    expect(doubled instanceof State).toBe(true);
    flushFrame();
    expect(doubled.sample()).toBe(4);
    flushFrame();
    expect(doubled.updates instanceof Stream).toBe(true);
  });
});
