// Property-based tests of the transactional invariants (ROADMAP v0.6):
// coalescing, phase order, the hold delay — on randomized graphs and inputs,
// checked against a pure functional model.
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  root,
  newStream,
  newBehavior,
  Stream,
  Behavior,
} from "@continuum-js/frp";

// A small pool of total unary functions to build random derivation chains.
const FN_POOL: Array<(x: number) => number> = [
  (x) => x + 1,
  (x) => x * 2,
  (x) => x - 3,
  (x) => -x,
  (x) => (x % 7) + 1,
];
const arbChain = fc.array(fc.integer({ min: 0, max: FN_POOL.length - 1 }), {
  minLength: 0,
  maxLength: 6,
});
const arbFires = fc.array(fc.integer({ min: -1000, max: 1000 }), {
  minLength: 1,
  maxLength: 20,
});

const applyChain = (chain: number[], x: number) =>
  chain.reduce((v, i) => FN_POOL[i](v), x);

const buildChain = (src: Stream<number>, chain: number[]) =>
  chain.reduce((e, i) => e.map(FN_POOL[i]), src);

describe("transactional invariants (property-based)", () => {
  test("glitch-freedom: a join over two random branches never sees a mixed state", () => {
    fc.assert(
      fc.property(arbChain, arbChain, arbFires, (ca, cb, fires) => {
        const [src, fire] = newStream<number>();
        const a = root(() => buildChain(src, ca).hold(0));
        const b = root(() => buildChain(src, cb).hold(0));
        const joined = Behavior.lift2((x, y) => [x, y] as const, a, b);
        const seen: Array<readonly [number, number]> = [];
        const un = joined.updates.listen((p) => seen.push(p));

        for (const v of fires) fire(v);
        un();

        // Exactly one delivery per fire, and each is the fully consistent
        // pair — the "half-updated" intermediate must not exist.
        expect(seen.length).toBe(fires.length);
        fires.forEach((v, i) => {
          expect(seen[i]).toEqual([applyChain(ca, v), applyChain(cb, v)]);
        });
      }),
    );
  });

  test("coalescing: merging two branches of one source yields one combined occurrence per moment", () => {
    fc.assert(
      fc.property(arbChain, arbChain, arbFires, (ca, cb, fires) => {
        const [src, fire] = newStream<number>();
        const left = buildChain(src, ca);
        const right = buildChain(src, cb);
        const merged = Stream.merge(left, right, (l, r) => l * 1000003 + r);
        const seen: number[] = [];
        const un = merged.listen((v) => seen.push(v));

        for (const v of fires) fire(v);
        un();

        expect(seen.length).toBe(fires.length); // never two per moment
        fires.forEach((v, i) => {
          expect(seen[i]).toBe(applyChain(ca, v) * 1000003 + applyChain(cb, v));
        });
      }),
    );
  });

  test("hold delay: snapshot from the same moment always reads the PREVIOUS value", () => {
    fc.assert(
      fc.property(fc.integer(), arbFires, (init, fires) => {
        const [src, fire] = newStream<number>();
        const held = root(() => src.hold(init));
        const pairs = src.snapshot(held, (now, prev) => [now, prev] as const);
        const seen: Array<readonly [number, number]> = [];
        const un = pairs.listen((p) => seen.push(p));

        for (const v of fires) fire(v);
        un();

        const model = fires.map(
          (v, i) => [v, i === 0 ? init : fires[i - 1]] as const,
        );
        expect(seen).toEqual(model);
      }),
    );
  });

  test("phase order: post-phase observers always see the committed value", () => {
    fc.assert(
      fc.property(fc.integer(), arbFires, arbChain, (init, fires, chain) => {
        const [b, set] = newBehavior<number>(init);
        const derived = chain.reduce((x, i) => x.map(FN_POOL[i]), b);
        const seen: Array<[number, number]> = [];
        // By the time a post-phase listener runs, sample() must equal the
        // delivered value — a listener can never catch the moment half-done.
        const un = derived.listen((v) => seen.push([v, derived.sample()]));

        for (const v of fires) set(v);
        un();

        for (const [delivered, sampled] of seen) {
          expect(sampled).toBe(delivered);
        }
        // And the deliveries themselves follow the functional model. The
        // source skips sets equal to the current value (Object.is), so the
        // model drops consecutive duplicates before mapping.
        const distinctFires: number[] = [];
        let prev = init;
        for (const v of fires) {
          if (!Object.is(prev, v)) {
            distinctFires.push(v);
            prev = v;
          }
        }
        expect(seen.map(([d]) => d)).toEqual(
          [init, ...distinctFires].map((v) => applyChain(chain, v)),
        );
      }),
    );
  });

  test("accum agrees with a functional fold after every moment", () => {
    fc.assert(
      fc.property(fc.integer(), arbFires, (init, fires) => {
        const [src, fire] = newStream<number>();
        const acc = root(() => src.accum(init, (a, s) => s * 31 + a));
        const un = acc.updates.listen(() => {});

        let model = init;
        for (const v of fires) {
          fire(v);
          model = model * 31 + v;
          expect(acc.sample()).toBe(model);
        }
        un();
      }),
    );
  });
});
