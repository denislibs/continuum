import { describe, test, expect } from "vitest";
import { newStream, newBehavior, constant, never } from "@continuum-js/frp";

describe("sources and basic push", () => {
  test("listen receives the value that was sent", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    e.listen((v) => seen.push(v));
    fire(1);
    fire(2);
    expect(seen).toEqual([1, 2]);
  });

  test("map transforms occurrence values", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    e.map((n) => n * 10).listen((v) => seen.push(v));
    fire(1);
    fire(3);
    expect(seen).toEqual([10, 30]);
  });

  test("filter keeps only matching occurrences", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    e.filter((n) => n % 2 === 0).listen((v) => seen.push(v));
    fire(1);
    fire(2);
    fire(3);
    fire(4);
    expect(seen).toEqual([2, 4]);
  });

  test("unlisten stops delivery", () => {
    const [e, fire] = newStream<number>();
    const seen: number[] = [];
    const un = e.listen((v) => seen.push(v));
    fire(1);
    un();
    fire(2);
    expect(seen).toEqual([1]);
  });
});

describe("never / constant", () => {
  test("never fires nothing", () => {
    const seen: number[] = [];
    never<number>().listen((v) => seen.push(v));
    expect(seen).toEqual([]);
  });

  test("constant behavior samples its value", () => {
    expect(constant(42).sample()).toBe(42);
  });
});

describe("hold and sample", () => {
  test("hold starts at init and updates across moments", () => {
    const [e, fire] = newStream<number>();
    const b = e.hold(0);
    expect(b.sample()).toBe(0);
    fire(5);
    expect(b.sample()).toBe(5);
    fire(7);
    expect(b.sample()).toBe(7);
  });

  test("newBehavior set updates the value", () => {
    const [b, set] = newBehavior(1);
    expect(b.sample()).toBe(2 - 1);
    set(9);
    expect(b.sample()).toBe(9);
  });
});

describe("hold delay semantics (classic FRP)", () => {
  test("snapshot within the moment sees the value at the start of the moment", () => {
    const [e, fire] = newStream<number>();
    const b = e.hold(0);
    // snapshot samples b in the same moment e fires; must see PRE-update value.
    const snapped: Array<[number, number]> = [];
    e.snapshot(b, (a, s) => [a, s] as [number, number]).listen((pair) =>
      snapped.push(pair),
    );
    fire(1); // b was 0 at start of this moment
    fire(2); // b was 1 at start of this moment
    fire(3); // b was 2 at start of this moment
    expect(snapped).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
  });
});

describe("listener bookkeeping under mutation (guards the Set refactor)", () => {
  test("a listener unsubscribed DURING delivery still receives the current occurrence", () => {
    const [e, fire] = newStream<number>();
    const seen: string[] = [];
    const unB: Array<() => void> = [];
    e.listen((v) => {
      seen.push(`a${v}`);
      unB.forEach((u) => u()); // kill B while the moment is being delivered
    });
    unB.push(e.listen((v) => seen.push(`b${v}`)));
    fire(1);
    expect(seen).toEqual(["a1", "b1"]); // b still saw the in-flight occurrence
    fire(2);
    expect(seen).toEqual(["a1", "b1", "a2"]); // and is gone afterwards
  });

  test("a listener subscribed DURING delivery does not receive the current occurrence", () => {
    const [e, fire] = newStream<number>();
    const seen: string[] = [];
    let subscribed = false;
    e.listen((v) => {
      seen.push(`a${v}`);
      if (!subscribed) {
        subscribed = true;
        e.listen((w) => seen.push(`late${w}`));
      }
    });
    fire(1);
    expect(seen).toEqual(["a1"]); // late joiner missed the in-flight moment
    fire(2);
    expect(seen).toEqual(["a1", "a2", "late2"]);
  });

  test("observers keep FIFO order across an unsubscribe in the middle", () => {
    const [e, fire] = newStream<number>();
    const seen: string[] = [];
    e.listen(() => seen.push("first"));
    const un = e.listen(() => seen.push("second"));
    e.listen(() => seen.push("third"));
    un();
    fire(0);
    expect(seen).toEqual(["first", "third"]);
  });

  test("double unlisten is idempotent and does not evict a neighbour", () => {
    const [e, fire] = newStream<number>();
    const seen: string[] = [];
    const un = e.listen(() => seen.push("a"));
    e.listen(() => seen.push("b"));
    un();
    un(); // second call must be a no-op
    fire(0);
    expect(seen).toEqual(["b"]);
  });
});
