// Small fixes from the adversarial review (Б6, Б9, Б14).
import { describe, test, expect, afterEach } from "vitest";
import {
  Scope,
  root,
  stream,
  perform,
  flushFrame,
  state,
  batch,
} from "@continuum-js/frp";

afterEach(() => flushFrame());

describe("Б6 — scope teardown is linear", () => {
  test("disposing a parent with many children does not scan siblings per child", () => {
    // Observable contract: a child disposed by its parent's dispose() must
    // not splice itself out of the parent's (already-draining) list. We
    // detect the scan by making `indexOf` on the children array loud.
    const parent = new Scope(null);
    const kids = Array.from({ length: 5 }, () => new Scope(parent));
    let scans = 0;
    const children = parent.children!;
    const orig = children.indexOf;
    children.indexOf = function (...args) {
      scans++;
      return orig.apply(this, args as [Scope]);
    };
    parent.dispose();
    expect(kids.every((k) => k.disposed)).toBe(true);
    expect(scans).toBe(0);
  });

  test("a child disposed on its own still detaches from a live parent", () => {
    const parent = new Scope(null);
    const a = new Scope(parent);
    const b = new Scope(parent);
    a.dispose();
    expect(parent.children).toEqual([b]);
  });
});

describe("Б9 — perform wraps a synchronous throw from run()", () => {
  test("a run() that throws before returning a promise yields a failed Result", async () => {
    const req = stream<number>();
    const seen: Array<{ ok: boolean; error?: unknown }> = [];
    root(() =>
      perform(req, () => {
        throw new Error("bad url");
      }),
    ).listen((r) => seen.push(r as { ok: boolean; error?: unknown }));
    req.fire(1);
    expect(() => flushFrame()).not.toThrow();
    await Promise.resolve();
    flushFrame();
    expect(seen).toEqual([{ ok: false, error: new Error("bad url") }]);
  });
});

describe("Б14 — the purity guard names the current API", () => {
  test("a fire inside a pure combinator mentions `at`, not `snapshot`", () => {
    const src = stream<number>();
    const other = stream<number>();
    const s = state(0);
    const mapped = src.map((n) => {
      other.fire(n);
      return n;
    });
    mapped.listen(() => {});
    let message = "";
    try {
      batch(() => src.fire(1));
    } catch (e) {
      message = (e as Error).message;
    }
    void s;
    expect(message).toMatch(/\bat\b/);
    expect(message).not.toMatch(/snapshot/);
  });
});
