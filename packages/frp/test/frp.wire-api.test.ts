// Phase 1 of REFACTOR-PLAN: the Wire naming and the declarative combinator
// surface. Data first, names as intents; the old names stay as deprecated
// aliases until 1.0 (the Event → Stream playbook).
import { describe, test, expect } from "vitest";
import {
  Wire,
  wire,
  stream,
  combine,
  flatten,
  Behavior,
  newBehavior,
  newStream,
  Stream,
  batch,
} from "@continuum-js/frp";

describe("Wire — the type rename", () => {
  test("Wire is the class; Behavior is the same class under a deprecated alias", () => {
    expect(Behavior).toBe(Wire);
    const [b] = newBehavior(1);
    expect(b instanceof Wire).toBe(true);
  });

  test("wire(init) is a source cell with .set", () => {
    const count = wire(0);
    expect(count.sample()).toBe(0);
    count.set(5);
    expect(count.sample()).toBe(5);
    const seen: number[] = [];
    count.listen((v) => seen.push(v));
    count.set(6);
    expect(seen).toEqual([5, 6]);
    count.set(6); // equality skip, like newBehavior
    expect(seen).toEqual([5, 6]);
  });

  test("wire(init, eq) honors a custom equality", () => {
    const user = wire({ id: 1, name: "a" }, (p, n) => p.id === n.id);
    const seen: string[] = [];
    user.listen((u) => seen.push(u.name));
    user.set({ id: 1, name: "b" }); // same id -> skipped
    user.set({ id: 2, name: "c" });
    expect(seen).toEqual(["a", "c"]);
  });

  test(".set/.update are standalone — safe to pass as handlers", () => {
    // bindInput(draft, draft.set) in the examples relies on this: the
    // setters must not lose their cell when detached from the wire.
    const count = wire(0);
    const { set, update } = count;
    set(5);
    expect(count.sample()).toBe(5);
    update((n) => n + 1);
    expect(count.sample()).toBe(6);
  });

  test("stream() is a source with .fire", () => {
    const clicks = stream<number>();
    const seen: number[] = [];
    clicks.listen((v) => seen.push(v));
    clicks.fire(7);
    expect(seen).toEqual([7]);
    // .fire is a standalone closure — safe to pass as a handler
    const f = clicks.fire;
    f(8);
    expect(seen).toEqual([7, 8]);
  });
});

describe("combine — variadic, data first", () => {
  test("combine(a, b, f) equals lift2 semantics, coalesced per moment", () => {
    const a = wire(1);
    const b = wire(10);
    const total = combine(a, b, (x, y) => x + y);
    expect(total.sample()).toBe(11);
    const seen: number[] = [];
    total.listen((v) => seen.push(v));
    batch(() => {
      a.set(2);
      b.set(20);
    });
    expect(seen).toEqual([11, 22]); // one recompute for the one moment
  });

  test("combine with three and four wires", () => {
    const a = wire(1);
    const b = wire(2);
    const c = wire(3);
    const d = wire(4);
    expect(combine(a, b, c, (x, y, z) => x + y + z).sample()).toBe(6);
    expect(combine(a, b, c, d, (x, y, z, w) => x + y + z + w).sample()).toBe(
      10,
    );
    const t = combine(
      a,
      b,
      c,
      d,
      (x, y, z, w) => x * 1000 + y * 100 + z * 10 + w,
    );
    const seen: number[] = [];
    t.listen((v) => seen.push(v));
    batch(() => {
      a.set(9);
      d.set(9);
    });
    expect(seen).toEqual([1234, 9239]); // glitch-free: one moment, one value
  });
});

describe("at — sampling a wire at a stream's moments", () => {
  test("draft.at(submits) captures the pre-moment value", () => {
    const submits = stream<null>();
    const draft = wire("");
    const submitted = draft.at(submits);
    const seen: string[] = [];
    submitted.listen((v) => seen.push(v));
    draft.set("hello");
    submits.fire(null);
    expect(seen).toEqual(["hello"]);
  });

  test("at with a combiner receives (value, event)", () => {
    const submits = stream<number>();
    const draft = wire("t");
    const tagged = draft.at(submits, (text, n) => `${text}:${n}`);
    const seen: string[] = [];
    tagged.listen((v) => seen.push(v));
    submits.fire(42);
    expect(seen).toEqual(["t:42"]);
  });
});

describe("when / or — stream intents", () => {
  test("clicks.when(enabled) passes occurrences only while true", () => {
    const clicks = stream<number>();
    const enabled = wire(false);
    const seen: number[] = [];
    clicks.when(enabled).listen((v) => seen.push(v));
    clicks.fire(1);
    enabled.set(true);
    clicks.fire(2);
    expect(seen).toEqual([2]);
  });

  test("ea.or(eb) is the left-biased merge", () => {
    const a = stream<string>();
    const b = stream<string>();
    const seen: string[] = [];
    a.or(b).listen((v) => seen.push(v));
    b.fire("b");
    a.fire("a");
    expect(seen).toEqual(["b", "a"]);
  });
});

describe("flatten — one name for both switches", () => {
  test("flatten over a wire of wires follows the selection", () => {
    const x = wire(1);
    const y = wire(10);
    const sel = wire<Wire<number>>(x);
    const flat = flatten(sel);
    expect(flat.sample()).toBe(1);
    sel.set(y);
    expect(flat.sample()).toBe(10);
    const seen: number[] = [];
    flat.listen((v) => seen.push(v));
    y.set(20);
    expect(seen).toEqual([10, 20]);
  });

  test("flatten over a wire of streams follows the selection", () => {
    const a = stream<number>();
    const b = stream<number>();
    const sel = wire<Stream<number>>(a);
    const flat = flatten(sel);
    const seen: number[] = [];
    flat.listen((v) => seen.push(v));
    a.fire(1);
    sel.set(b);
    b.fire(2);
    a.fire(99); // no longer selected
    expect(seen).toEqual([1, 2]);
  });
});

describe("deprecated aliases stay callable until 1.0", () => {
  test("newBehavior/newStream/lift2/gate/orElse/snapshot still work", () => {
    const [b, setB] = newBehavior(1);
    const [e, fire] = newStream<number>();
    const lifted = Behavior.lift2((x, y) => x + y, b, b);
    expect(lifted.sample()).toBe(2);
    const snap = e.snapshot(b, (a, v) => a + v);
    const seen: number[] = [];
    snap.listen((v) => seen.push(v));
    setB(5);
    fire(1);
    expect(seen).toEqual([6]);
  });
});
