/// <reference types="node" />
// Structural fuzzer for the engine's two laws (FRP-MODEL §12):
//   law 1  push ≡ pull   — after every moment, what listeners received equals
//                          what sample() answers; a cold twin answers the same
//                          as a warm one (cold ≡ warm).
//   law 2  abort = no-trace — a moment aborted by a throw leaves the graph
//                          indistinguishable from the twin that never ran it.
//
// The fuzzer builds TWIN graphs from one random spec, drives both with the
// same operation sequence and cross-checks the laws after every op. Known
// violations are pinned below as `test.fails` seeds tagged with the phase of
// REFACTOR-PLAN.md that turns them into plain `test`s.
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  newStream,
  newBehavior,
  batch,
  root,
  Stream,
  Behavior,
} from "@continuum-js/frp";

// Pure pools — combinator callbacks must not close over mutable state.
const FN: Array<(x: number) => number> = [
  (x) => x + 1,
  (x) => x * 2,
  (x) => x - 3,
  (x) => -x,
  (x) => (x % 7) + 1,
];
const PRED: Array<(x: number) => boolean> = [
  (x) => x % 2 === 0,
  (x) => x > 0,
  () => true,
  (x) => x % 3 !== 0,
];

// Armed only while an abortFire op executes on the warm twin: the boom node
// then throws mid-delivery, aborting the moment (law-2 probe).
let bombArmed = false;

// --- graph spec ------------------------------------------------------------

type NodeSpec =
  | { k: "smap"; src: number; f: number } // stream.map
  | { k: "filter"; src: number; p: number }
  | { k: "merge"; a: number; b: number }
  | { k: "snapshot"; e: number; w: number }
  | { k: "hold"; src: number; init: number }
  | { k: "accum"; src: number; f: number; init: number }
  | { k: "wmap"; src: number; f: number } // state.map
  | { k: "combine"; a: number; b: number; f: number } // lift2
  | { k: "boom"; src: number } // a map that throws while the bomb is armed
  | { k: "swb"; sel: number; a: number; b: number }; // flatten over states

interface GraphSpec {
  nStreams: number; // source streams
  nCells: number; // source cells (newBehavior)
  nodes: NodeSpec[];
}

type Op =
  | { o: "fire"; src: number; v: number }
  | { o: "set"; cell: number; v: number }
  | { o: "batch"; items: Array<{ cell: number; v: number }> }
  | { o: "listen"; node: number } // cold twin gains a listener on a PURE node
  | { o: "unlisten"; idx: number } // ...and may drop one it added earlier
  // law-2 ops: the WARM twin runs an aborting moment, the cold twin skips
  // it entirely — afterwards the twins must still agree (abort = no-trace).
  | { o: "abortSet"; cell: number; v: number }
  | { o: "abortFire"; boom: number; v: number };

interface Built {
  fires: Array<(v: number) => void>;
  sets: Array<(v: number) => void>;
  states: Array<{ w: Behavior<number>; pure: boolean }>;
  streams: Array<{ s: Stream<number>; pure: boolean }>;
  /** Source indices that feed a boom node (abortFire targets). */
  boomSrcs: number[];
}

function build(spec: GraphSpec): Built {
  const g: Built = {
    fires: [],
    sets: [],
    states: [],
    streams: [],
    boomSrcs: [],
  };
  for (let i = 0; i < spec.nStreams; i++) {
    const [s, fire] = newStream<number>();
    g.streams.push({ s, pure: true }); // a bare source is safe to churn
    g.fires.push(fire);
  }
  for (let i = 0; i < spec.nCells; i++) {
    const [w, set] = newBehavior(i);
    g.states.push({ w, pure: true }); // sources are pinned — churn-safe
    g.sets.push(set);
  }
  const pickS = (i: number) => g.streams[i % g.streams.length];
  const pickW = (i: number) => g.states[i % g.states.length];
  for (const n of spec.nodes) {
    switch (n.k) {
      case "smap": {
        const src = pickS(n.src);
        g.streams.push({ s: src.s.map(FN[n.f % FN.length]), pure: src.pure });
        break;
      }
      case "filter": {
        const src = pickS(n.src);
        g.streams.push({
          s: src.s.filter(PRED[n.p % PRED.length]),
          pure: src.pure,
        });
        break;
      }
      case "merge": {
        const a = pickS(n.a);
        const b = pickS(n.b);
        g.streams.push({
          s: Stream.merge(a.s, b.s, (l, r) => l * 31 + r),
          pure: a.pure && b.pure,
        });
        break;
      }
      case "snapshot": {
        const e = pickS(n.e);
        const w = pickW(n.w);
        g.streams.push({
          s: e.s.snapshot(w.w, (a, b) => a * 17 + b),
          pure: e.pure,
        });
        break;
      }
      case "hold": {
        const src = pickS(n.src);
        g.states.push({ w: src.s.hold(n.init), pure: false });
        break;
      }
      case "accum": {
        const src = pickS(n.src);
        g.states.push({
          w: src.s.accum(n.init ?? 0, (a, acc) => FN[n.f % FN.length](acc + a)),
          pure: false,
        });
        break;
      }
      case "wmap": {
        const src = pickW(n.src);
        g.states.push({ w: src.w.map(FN[n.f % FN.length]), pure: src.pure });
        break;
      }
      case "boom": {
        const i = n.src % spec.nStreams; // attach straight to a source
        g.streams.push({
          s: g.streams[i].s.map((x) => {
            if (bombArmed) throw new Error("boom");
            return x;
          }),
          pure: true,
        });
        g.boomSrcs.push(i);
        break;
      }
      case "combine": {
        const a = pickW(n.a);
        const b = pickW(n.b);
        g.states.push({
          w: Behavior.lift2((x, y) => x * 13 + y, a.w, b.w),
          pure: a.pure && b.pure,
        });
        break;
      }
      case "swb": {
        // a numeric state chooses between two existing states; flatten follows.
        // Simultaneous switch + inner update in one batch exercises the
        // phase-6 semantics (post-commit emission).
        const wa = pickW(n.a);
        const wb = pickW(n.b);
        const chooser = pickW(n.sel);
        const sel = chooser.w.map((v) => (v % 2 === 0 ? wa.w : wb.w));
        g.states.push({ w: Behavior.switchB(sel), pure: true });
        break;
      }
    }
  }
  return g;
}

// --- arbitraries -------------------------------------------------------------

const arbNode: fc.Arbitrary<NodeSpec> = fc.oneof(
  fc.record({ k: fc.constant("smap" as const), src: fc.nat(20), f: fc.nat(9) }),
  fc.record({
    k: fc.constant("filter" as const),
    src: fc.nat(20),
    p: fc.nat(9),
  }),
  fc.record({ k: fc.constant("merge" as const), a: fc.nat(20), b: fc.nat(20) }),
  fc.record({
    k: fc.constant("snapshot" as const),
    e: fc.nat(20),
    w: fc.nat(20),
  }),
  fc.record({
    k: fc.constant("hold" as const),
    src: fc.nat(20),
    init: fc.integer({ min: -5, max: 5 }),
  }),
  fc.record({
    k: fc.constant("accum" as const),
    src: fc.nat(20),
    f: fc.nat(9),
    init: fc.constant(0),
  }),
  fc.record({ k: fc.constant("wmap" as const), src: fc.nat(20), f: fc.nat(9) }),
  fc.record({
    k: fc.constant("combine" as const),
    a: fc.nat(20),
    b: fc.nat(20),
    f: fc.nat(9),
  }),
  fc.record({ k: fc.constant("boom" as const), src: fc.nat(20) }),
  fc.record({
    k: fc.constant("swb" as const),
    sel: fc.nat(20),
    a: fc.nat(20),
    b: fc.nat(20),
  }),
);

const arbSpec: fc.Arbitrary<GraphSpec> = fc.record({
  nStreams: fc.integer({ min: 1, max: 3 }),
  nCells: fc.integer({ min: 1, max: 3 }),
  nodes: fc.array(arbNode, { minLength: 1, maxLength: 12 }),
});

const arbOp: fc.Arbitrary<Op> = fc.oneof(
  {
    weight: 4,
    arbitrary: fc.record({
      o: fc.constant("fire" as const),
      src: fc.nat(20),
      v: fc.integer({ min: -50, max: 50 }),
    }),
  },
  {
    weight: 4,
    arbitrary: fc.record({
      o: fc.constant("set" as const),
      cell: fc.nat(20),
      v: fc.integer({ min: -50, max: 50 }),
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      o: fc.constant("batch" as const),
      items: fc.array(
        fc.record({ cell: fc.nat(20), v: fc.integer({ min: -50, max: 50 }) }),
        { minLength: 1, maxLength: 4 },
      ),
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      o: fc.constant("listen" as const),
      node: fc.nat(30),
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      o: fc.constant("unlisten" as const),
      idx: fc.nat(20),
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      o: fc.constant("abortSet" as const),
      cell: fc.nat(20),
      v: fc.integer({ min: -50, max: 50 }),
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      o: fc.constant("abortFire" as const),
      boom: fc.nat(20),
      v: fc.integer({ min: -50, max: 50 }),
    }),
  },
);

const arbOps = fc.array(arbOp, { minLength: 1, maxLength: 30 });

// --- the twin run ------------------------------------------------------------

function runTwins(spec: GraphSpec, ops: Op[]): void {
  root((disposeRun) => {
    runTwinsIn(spec, ops);
    disposeRun(); // the graphs' stateful processes die with the run
  });
}

function runTwinsIn(spec: GraphSpec, ops: Op[]): void {
  const warm = build(spec);
  const cold = build(spec);

  // The warm twin observes EVERYTHING from the start; `last[i]` is the most
  // recent pushed value per state — the push side of law 1.
  const last: number[] = [];
  const undos: Array<() => void> = [];
  warm.states.forEach(({ w }, i) => {
    undos.push(w.listen((v) => (last[i] = v)));
  });
  warm.streams.forEach(({ s }) => {
    undos.push(s.listen(() => {}));
  });

  // The cold twin only ever gains/loses listeners on PURE nodes via ops.
  const coldHandles: Array<() => void> = [];

  const checkLaws = () => {
    for (let i = 0; i < warm.states.length; i++) {
      // law 1, push ≡ pull (on the warm twin)
      expect(last[i]).toBe(warm.states[i].w.sample());
      // law 1, cold ≡ warm (across twins)
      expect(cold.states[i].w.sample()).toBe(warm.states[i].w.sample());
    }
  };

  for (const op of ops) {
    switch (op.o) {
      case "fire": {
        const i = op.src % warm.fires.length;
        warm.fires[i](op.v);
        cold.fires[i](op.v);
        break;
      }
      case "set": {
        const i = op.cell % warm.sets.length;
        warm.sets[i](op.v);
        cold.sets[i](op.v);
        break;
      }
      case "batch": {
        batch(() => {
          for (const it of op.items)
            warm.sets[it.cell % warm.sets.length](it.v);
        });
        batch(() => {
          for (const it of op.items)
            cold.sets[it.cell % cold.sets.length](it.v);
        });
        break;
      }
      case "listen": {
        // phase 3 made stateful nodes churn-safe: listen anywhere
        const w = cold.states[op.node % cold.states.length].w;
        coldHandles.push(w.listen(() => {}));
        break;
      }
      case "unlisten": {
        if (coldHandles.length === 0) break;
        const i = op.idx % coldHandles.length;
        coldHandles.splice(i, 1)[0]();
        break;
      }
      case "abortSet": {
        // warm only: the moment aborts in the batch body, after the set
        const i = op.cell % warm.sets.length;
        expect(() =>
          batch(() => {
            warm.sets[i](op.v * 3 + 1); // a value normal ops don't produce? irrelevant — abort discards it
            throw new Error("abort");
          }),
        ).toThrow("abort");
        break;
      }
      case "abortFire": {
        if (warm.boomSrcs.length === 0) break;
        const i = warm.boomSrcs[op.boom % warm.boomSrcs.length];
        bombArmed = true;
        try {
          expect(() => warm.fires[i](op.v)).toThrow("boom");
        } finally {
          bombArmed = false;
        }
        break;
      }
    }
    checkLaws();
  }

  for (const un of coldHandles) un();
  for (const un of undos) un();
}

const RUNS = Number(process.env.FUZZ_RUNS ?? 80);

describe("fuzz — the two laws on random graphs", () => {
  test(`push≡pull and cold≡warm hold across ${RUNS} random graphs`, () => {
    fc.assert(
      fc.property(arbSpec, arbOps, (spec, ops) => {
        runTwins(spec, ops);
      }),
      { numRuns: RUNS },
    );
  });

  test("sleep = detach: a pure chain with churned listeners never computes cold", () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(9), { minLength: 1, maxLength: 6 }),
        fc.integer({ min: 1, max: 5 }),
        (chain, churns) => {
          const [src, fire] = newStream<number>();
          let calls = 0;
          let node = src.map((x) => {
            calls++;
            return x;
          });
          for (const f of chain) node = node.map(FN[f % FN.length]);
          for (let i = 0; i < churns; i++) {
            const un = node.listen(() => {});
            un();
          }
          const before = calls;
          fire(1);
          expect(calls).toBe(before); // asleep: the source pays nothing
        },
      ),
      { numRuns: 40 },
    );
  });
});

// --- known violations, pinned until their phase ------------------------------
// Each seed asserts the LAW (the correct behavior). `test.fails` inverts it:
// the suite stays green while the bug exists, and starts failing the moment
// the fix lands — forcing the flip to a plain `test` in the right phase.

describe("fuzz seeds — known law violations (flip to test() in their phase)", () => {
  test("[фаза 3 ✓] a hold survives its last unlisten (law 1: no lying nodes)", () => {
    root(() => {
      const [src, fire] = newStream<number>();
      const held = src.hold(0);
      const un = held.listen(() => {});
      fire(1);
      un();
      fire(2);
      expect(held.sample()).toBe(2);
      expect(() => held.listen(() => {})).not.toThrow();
    });
  });

  test("[фаза 5 ✓] an aborted batch does not poison the cell's equality skip (law 2)", () => {
    const [b, setB] = newBehavior(1);
    const [other] = newStream<number>();
    let armed = true;
    const bomb = Stream.merge(b.updates, other, (l) => l).map((x) => {
      if (armed && x === 5) {
        armed = false;
        throw new Error("boom");
      }
      return x;
    });
    bomb.listen(() => {});
    expect(() => batch(() => setB(5))).toThrow();
    setB(5); // bomb disarmed; today this is a silent no-op
    expect(b.sample()).toBe(5);
  });

  test("[фаза 5 ✓] a combine woken inside a batch body reseeds from committed values (law 1)", () => {
    const [a, setA] = newBehavior(1);
    const [b, setB] = newBehavior(10);
    setB(20);
    const sum = Behavior.lift2((x, y) => x + y, a, b);
    const seen: number[] = [];
    batch(() => {
      sum.listen((v) => seen.push(v)); // wake mid-moment
      setA(2); // commit lands AFTER today's reseed
    });
    setB(30);
    expect(seen[seen.length - 1]).toBe(sum.sample()); // today: push 31, pull 32
  });

  test("[фаза 6 ✓] flatten converges on simultaneous switch + inner update (law 1)", () => {
    const [x] = newBehavior(1);
    const [y, setY] = newBehavior(10);
    const [sel, setSel] = newBehavior<Behavior<number>>(x);
    const sw = Behavior.switchB(sel);
    const seen: number[] = [];
    sw.listen((v) => seen.push(v));
    batch(() => {
      setSel(y);
      setY(99);
    });
    expect(seen[seen.length - 1]).toBe(sw.sample()); // today: push 10, pull 99
  });

  test("[фаза 6 ✓] a cell delivers ONE coalesced updates occurrence per moment", () => {
    const [b, setB] = newBehavior(0);
    const seen: number[] = [];
    b.updates.listen((v) => seen.push(v));
    batch(() => {
      setB(1);
      setB(2);
    });
    expect(seen).toEqual([2]); // today: [1, 2] — the intermediate leaks
  });
});
