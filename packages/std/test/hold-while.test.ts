import { describe, test, expect, afterEach } from "vitest";
import { state, flushFrame, Stream } from "@continuum-js/frp";
import { holdWhile } from "@continuum-js/std";

const edgeCount = (e: Stream<unknown>): number => {
  const n = e as unknown as { ob0: unknown; obs: unknown[] | null };
  return (n.ob0 ? 1 : 0) + (n.obs?.length ?? 0);
};

afterEach(() => flushFrame());

describe("holdWhile", () => {
  test("passes changes through while the gate is off", () => {
    const b = state(1);
    const gate = state(false);
    const h = holdWhile(b, gate);
    const seen: number[] = [];
    h.updates.listen((v) => seen.push(v));
    b.set(2);
    flushFrame();
    expect(seen).toEqual([2]);
    expect(h.sample()).toBe(2);
  });

  test("freezes while the gate is on, then releases the latest value once", () => {
    const b = state(1);
    const gate = state(false);
    const h = holdWhile(b, gate);
    const seen: number[] = [];
    h.updates.listen((v) => seen.push(v));
    gate.set(true);
    b.set(2);
    b.set(3);
    flushFrame();
    expect(seen).toEqual([]);
    expect(h.sample()).toBe(1); // the held value, not the live one
    gate.set(false);
    flushFrame();
    expect(seen).toEqual([3]);
    expect(h.sample()).toBe(3);
  });

  test("releasing without a change in between emits nothing", () => {
    const b = state(1);
    const gate = state(false);
    const h = holdWhile(b, gate);
    const seen: number[] = [];
    h.updates.listen((v) => seen.push(v));
    gate.set(true);
    gate.set(false);
    flushFrame();
    expect(seen).toEqual([]);
  });

  test("a gate already on at construction holds the initial value", () => {
    const b = state(1);
    const gate = state(true);
    const h = holdWhile(b, gate);
    b.set(2);
    expect(h.sample()).toBe(1);
    gate.set(false);
    expect(h.sample()).toBe(2);
  });

  test("is a formula: attached to its inputs only while listened", () => {
    const b = state(1);
    const gate = state(false);
    const h = holdWhile(b, gate);
    expect(edgeCount(b.updates) + edgeCount(gate.updates)).toBe(0);
    const un = h.updates.listen(() => {});
    expect(edgeCount(b.updates)).toBe(1);
    expect(edgeCount(gate.updates)).toBe(1);
    un();
    expect(edgeCount(b.updates) + edgeCount(gate.updates)).toBe(0);
  });

  test("reseeds from the live value on wake", () => {
    const b = state(1);
    const gate = state(false);
    const h = holdWhile(b, gate);
    h.updates.listen(() => {})(); // warm once, then sleep
    b.set(5); // changes while asleep
    expect(h.sample()).toBe(5); // cold: pull-through
    const seen: number[] = [];
    h.updates.listen((v) => seen.push(v));
    b.set(6);
    flushFrame();
    expect(seen).toEqual([6]);
  });
});
