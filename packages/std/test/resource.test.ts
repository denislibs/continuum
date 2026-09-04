import { describe, test, expect } from "vitest";
import { root, newStream } from "@continuum-js/frp";
import { resource, type Async } from "@continuum-js/std";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("resource", () => {
  test("walks idle → loading → ok as the promise settles", async () => {
    const [trigger, fire] = newStream<string>();
    let resolve!: (v: string[]) => void;
    const state = root(() =>
      resource<string, string[]>(
        trigger,
        () => new Promise<string[]>((res) => (resolve = res)),
      ),
    );

    expect(state.sample().status).toBe("idle");
    fire("ann");
    expect(state.sample().status).toBe("loading");

    resolve(["ann", "anna"]);
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["ann", "anna"] });
  });

  test("captures rejection as an error state", async () => {
    const [trigger, fire] = newStream<string>();
    const state = root(() =>
      resource<string, string[]>(trigger, () =>
        Promise.reject(new Error("boom")),
      ),
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
    const [trigger, fire] = newStream<string>();
    const state = root(() =>
      resource<string, string[]>(
        trigger,
        () => new Promise<string[]>((res) => resolvers.push(res)),
      ),
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

  // #115: last-request-wins must apply to failures too — a late rejection of a
  // superseded request must not overwrite a newer success.
  test("a stale rejection does not clobber a newer success", async () => {
    const settlers: Array<{
      res: (v: string[]) => void;
      rej: (e: unknown) => void;
    }> = [];
    const [trigger, fire] = newStream<string>();
    const state = root(() =>
      resource<string, string[]>(
        trigger,
        () => new Promise<string[]>((res, rej) => settlers.push({ res, rej })),
      ),
    );

    fire("first");
    fire("second");

    settlers[1].res(["from-second"]);
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });

    settlers[0].rej(new Error("late-first-failure")); // stale — must be ignored
    await tick();
    expect(state.sample()).toEqual({ status: "ok", value: ["from-second"] });
  });
  test("a stale rejection leaves the newer request in its loading state", async () => {
    const rejecters: Array<(e: unknown) => void> = [];
    const [trigger, fire] = newStream<string>();
    const state = root(() =>
      resource<string, string[]>(
        trigger,
        () => new Promise<string[]>((_res, rej) => rejecters.push(rej)),
      ),
    );

    fire("first");
    fire("second");

    rejecters[0](new Error("first failed after being superseded"));
    await tick();
    expect(state.sample().status).toBe("loading");
  });
});
