// Engine hooks for devtools: the effect zone (where layout reads are a
// violation of law 3) and the live counters (scopes, subscriptions, moments).
import { describe, test, expect, afterEach } from "vitest";
import {
  state,
  stream,
  root,
  batch,
  observe_,
  unobserve_,
  flushFrame,
  requestMeasure,
  inEffectZone,
  withLayout,
  effectZone_,
  setDevHooks,
  Stream,
  Scope,
} from "@continuum-js/frp";

afterEach(() => {
  flushFrame();
  setDevHooks(null);
});

describe("effect zone", () => {
  test("is off outside the frame pass", () => {
    expect(inEffectZone()).toBe(false);
    const s = state(0);
    s.set(1); // the moment itself is not the zone
    expect(inEffectZone()).toBe(false);
  });

  test("is on inside bindings and effects, off inside measures", () => {
    const s = state(0);
    const log: Array<[string, boolean]> = [];
    observe_(s.updates, () => log.push(["binding", inEffectZone()]));
    s.updates.listen(() => log.push(["effect", inEffectZone()]));
    s.set(1);
    requestMeasure(() => log.push(["measure", inEffectZone()]));
    flushFrame();
    expect(log).toEqual([
      ["measure", false],
      ["binding", true],
      ["effect", true],
    ]);
    expect(inEffectZone()).toBe(false); // restored after the pass
  });

  test("stays on across a moment opened from inside the pass", () => {
    const a = state(0);
    const b = state(0);
    const log: boolean[] = [];
    observe_(b.updates, () => log.push(inEffectZone()));
    a.updates.listen(() => b.set(1)); // nested moment → b's binding, same pass
    a.set(1);
    flushFrame();
    expect(log).toEqual([true]);
  });

  test("withLayout() suspends the zone for the callback only", () => {
    const s = state(0);
    const log: boolean[] = [];
    s.updates.listen(() => {
      log.push(inEffectZone());
      const r = withLayout(() => {
        log.push(inEffectZone());
        return 42;
      });
      expect(r).toBe(42);
      log.push(inEffectZone());
    });
    s.set(1);
    flushFrame();
    expect(log).toEqual([true, false, true]);
  });

  test("effectZone_() lets a renderer mark its own effect phases", () => {
    effectZone_(1);
    expect(inEffectZone()).toBe(true);
    effectZone_(-1);
    expect(inEffectZone()).toBe(false);
  });

  test("a throwing observer still restores the zone", () => {
    const s = state(0);
    s.updates.listen(() => {
      throw new Error("boom");
    });
    s.set(1);
    expect(() => flushFrame()).toThrow("boom");
    expect(inEffectZone()).toBe(false);
  });
});

describe("dev hooks", () => {
  test("count scopes through creation and disposal (children included)", () => {
    let scopes = 0;
    setDevHooks({ scope: (d) => (scopes += d) });
    root((dispose) => {
      expect(scopes).toBe(1);
      new Scope(); // attaches to the ambient (root) scope
      expect(scopes).toBe(2);
      dispose(); // children first, then the root itself
    });
    expect(scopes).toBe(0);
  });

  test("count subscriptions through listen/unlisten and observe_/unobserve_", () => {
    let edges = 0;
    setDevHooks({ edge: (d) => (edges += d) });
    const s = stream<number>();
    const un = s.listen(() => {});
    expect(edges).toBe(1);
    const h = observe_(s, () => {});
    expect(edges).toBe(2);
    un();
    expect(edges).toBe(1);
    unobserve_(s, h);
    expect(edges).toBe(0);
    un(); // idempotent: no double decrement
    expect(edges).toBe(0);
  });

  test("count the edges a formula attaches and detaches as it wakes and sleeps", () => {
    let edges = 0;
    setDevHooks({ edge: (d) => (edges += d) });
    const s = stream<number>();
    const m = s.map((n) => n + 1); // cold: nothing attached
    expect(edges).toBe(0);
    const un = m.listen(() => {}); // wakes: m → s, listener → m
    expect(edges).toBe(2);
    un(); // sleeps: both gone
    expect(edges).toBe(0);
  });

  test("count edges dropped by dispose()", () => {
    let edges = 0;
    setDevHooks({ edge: (d) => (edges += d) });
    const s = new Stream<number>(0);
    s.listen(() => {});
    s.listen(() => {});
    expect(edges).toBe(2);
    s.dispose();
    expect(edges).toBe(0);
  });

  test("count moments: one per set outside a batch, one per batch", () => {
    let moments = 0;
    setDevHooks({ moment: () => moments++ });
    const a = state(0);
    const b = state(0);
    a.set(1);
    expect(moments).toBe(1);
    batch(() => {
      a.set(2);
      b.set(2);
    });
    expect(moments).toBe(2);
  });

  test("setDevHooks(null) stops counting", () => {
    let scopes = 0;
    setDevHooks({ scope: (d) => (scopes += d) });
    setDevHooks(null);
    root(() => {});
    expect(scopes).toBe(0);
  });
});
