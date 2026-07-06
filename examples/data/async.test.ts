import { describe, test, expect, vi, afterEach } from "vitest";
import { newEvent } from "@continuum/frp";
import { resource, debounce, type Async } from "./async";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("resource", () => {
  test("walks idle → loading → ok as the promise settles", async () => {
    const [trigger, fire] = newEvent<string>();
    let resolve!: (v: string[]) => void;
    const state = resource<string, string[]>(
      trigger,
      () => new Promise<string[]>((res) => (resolve = res))
    );

    expect(state.sample().status).toBe("idle");

    fire("ann");
    expect(state.sample().status).toBe("loading");

    resolve(["ann", "anna"]);
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["ann", "anna"] });
  });

  test("captures rejection as an error state", async () => {
    const [trigger, fire] = newEvent<string>();
    const state = resource<string, string[]>(trigger, () =>
      Promise.reject(new Error("boom"))
    );

    fire("x");
    await tick();

    const s = state.sample();
    expect(s.status).toBe("error");
    expect((s as Extract<Async<unknown>, { status: "error" }>).error).toEqual(
      new Error("boom")
    );
  });

  test("drops a stale response when a newer request has been issued", async () => {
    const resolvers: Array<(v: string[]) => void> = [];
    const [trigger, fire] = newEvent<string>();
    const state = resource<string, string[]>(
      trigger,
      () => new Promise<string[]>((res) => resolvers.push(res))
    );

    fire("first"); // request #1
    fire("second"); // request #2 supersedes #1

    resolvers[1](["from-second"]); // newest resolves first
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });

    resolvers[0](["from-first"]); // stale response arrives late — ignored
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });
  });
});

describe("debounce", () => {
  afterEach(() => vi.useRealTimers());

  test("coalesces a burst into a single trailing occurrence", () => {
    vi.useFakeTimers();
    const [e, fire] = newEvent<string>();
    const seen: string[] = [];
    debounce(e, 200).listen((v) => seen.push(v));

    fire("a");
    fire("ab");
    fire("abc");
    vi.advanceTimersByTime(199);
    expect(seen).toEqual([]); // still quiet

    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["abc"]); // only the last value, once
  });
});
