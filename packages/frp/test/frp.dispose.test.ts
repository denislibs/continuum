import { describe, test, expect } from "vitest";
import { root, newStream, Stream } from "@continuum-js/frp";

describe("Stream.dispose", () => {
  test("detaches a derived node from its source", () => {
    const [src, fire] = newStream<number>();
    let calls = 0;
    const m = src.map((n) => {
      calls++;
      return n;
    });
    m.listen(() => {});
    fire(1);
    expect(calls).toBe(1);
    m.dispose();
    fire(2);
    expect(calls).toBe(1); // no longer wired to source
  });

  test("is idempotent", () => {
    const [src] = newStream<number>();
    const m = src.map((n) => n);
    m.dispose();
    expect(() => m.dispose()).not.toThrow();
  });

  test("never disposes the underlying source", () => {
    const [src, fire] = newStream<number>();
    const m = src.map((n) => n);
    m.dispose();
    let seen = 0;
    src.listen(() => seen++);
    fire(1);
    expect(seen).toBe(1); // source still works after a derived node is disposed
  });

  test("cascades upstream through derived intermediates that become unused", () => {
    const [src, fire] = newStream<number>();
    let midCalls = 0;
    const mid = src.map((n) => {
      midCalls++;
      return n;
    });
    const leaf = mid.map((n) => n);
    leaf.dispose(); // leaf was mid's only consumer -> mid torn down too
    fire(1);
    expect(midCalls).toBe(0);
  });

  test("keeps a shared intermediate alive while other consumers remain", () => {
    const [src, fire] = newStream<number>();
    let midCalls = 0;
    const mid = src.map((n) => {
      midCalls++;
      return n;
    });
    const a = mid.map((n) => n);
    a.listen(() => {});
    const b = mid.map((n) => n); // second consumer (kept, LIVE)
    b.listen(() => {});
    a.dispose();
    fire(1);
    expect(midCalls).toBe(1); // mid still feeds b
  });

  test("disposing a merge detaches from both inputs", () => {
    const [ea, fireA] = newStream<number>();
    const [eb, fireB] = newStream<number>();
    const merged = Stream.merge(ea, eb, (x, y) => x + y);
    const seen: number[] = [];
    merged.listen((v) => seen.push(v));
    fireA(1);
    merged.dispose();
    fireA(2);
    fireB(3);
    expect(seen).toEqual([1]);
  });
});

describe("State.dispose", () => {
  test("detaches a stepped behavior from its source event", () => {
    const [e, fire] = newStream<number>();
    const b = root(() => e.hold(0));
    let seen = 0;
    b.updates.listen(() => seen++);
    fire(1);
    expect(seen).toBe(1);
    b.dispose();
    fire(2);
    expect(seen).toBe(1);
  });
});
