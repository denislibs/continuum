import { describe, test, expect } from "vitest";
import { root, newStream } from "@continuum-js/frp";
import { distinct, perform } from "@continuum-js/frp";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("distinct", () => {
  test("suppresses consecutive duplicates (Object.is default)", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    distinct(e).listen((v) => seen.push(v));
    fire(1);
    fire(1);
    fire(2);
    fire(2);
    fire(1);
    expect(seen).toEqual([1, 2, 1]);
  });

  test("uses a custom equality", () => {
    const [e, fire] = newStream<{ id: number }>();
    const seen: number[] = [];
    distinct(e, (a, b) => a.id === b.id).listen((v) => seen.push(v.id));
    fire({ id: 1 });
    fire({ id: 1 }); // different object, same id -> suppressed
    fire({ id: 2 });
    expect(seen).toEqual([1, 2]);
  });
});

describe("perform", () => {
  test("delivers a successful Result on a fresh moment", async () => {
    const [req, fire] = newStream<number>();
    const seen: Array<{ ok: boolean; value?: number }> = [];
    root(() => perform(req, async (n) => n * 2)).listen((r) =>
      seen.push(r as { ok: boolean; value?: number }),
    );
    fire(5);
    await tick();
    expect(seen).toEqual([{ ok: true, value: 10 }]);
  });

  test("wraps a rejection into a failed Result", async () => {
    const [req, fire] = newStream<number>();
    const seen: Array<{ ok: boolean; error?: unknown }> = [];
    root(() =>
      perform(req, async () => {
        throw new Error("boom");
      }),
    ).listen((r) => seen.push(r as { ok: boolean; error?: unknown }));
    fire(1);
    await tick();
    expect(seen).toHaveLength(1);
    expect(seen[0].ok).toBe(false);
    expect((seen[0].error as Error).message).toBe("boom");
  });
});
