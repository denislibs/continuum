import { describe, test, expect } from "vitest";
import { newEvent } from "@continuum-js/frp";
import { resource, type Async } from "@continuum-js/std";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("resource", () => {
  test("walks idle → loading → ok as the promise settles", async () => {
    const [trigger, fire] = newEvent<string>();
    let resolve!: (v: string[]) => void;
    const state = resource<string, string[]>(
      trigger,
      () => new Promise<string[]>((res) => (resolve = res)),
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
      Promise.reject(new Error("boom")),
    );

    fire("x");
    await tick();
    const s = state.sample();
    expect(s.status).toBe("error");
    expect((s as Extract<Async<unknown>, { status: "error" }>).error).toEqual(
      new Error("boom"),
    );
  });

  test("drops a stale response when a newer request was issued", async () => {
    const resolvers: Array<(v: string[]) => void> = [];
    const [trigger, fire] = newEvent<string>();
    const state = resource<string, string[]>(
      trigger,
      () => new Promise<string[]>((res) => resolvers.push(res)),
    );

    fire("first");
    fire("second");

    resolvers[1](["from-second"]);
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });

    resolvers[0](["from-first"]); // stale — ignored
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });
  });
});
