// Core µbenchmarks: bytes per entity, garbage per operation, time per
// operation — the engine numbers the perf rounds kept re-measuring by hand.
// Every case runs in its OWN child process: JIT feedback from one case
// poisons the next inside a shared isolate (round-6 lesson — the mixed
// harness showed 10 listeners cheaper than 1).
//
//   npm run bench:core            (build the packages first: npm run build)
//
// Numbers are comparable only on the same machine, ideally the same session.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// Child: one case, printed as JSON on the last line.
// ---------------------------------------------------------------------------

const CASE = process.env.CORE_CASE;
if (CASE) {
  const { state, stream, root, selector, Stream, combine, batch } =
    await import("@continuum-js/frp");

  const gcNow = () => {
    global.gc();
    global.gc();
    global.gc();
  };
  const heap = () => {
    gcNow();
    return process.memoryUsage().heapUsed;
  };

  // retained bytes per entity: build N, keep them alive, full GC around
  const N = 100_000;
  function entity(make) {
    const keep = new Array(N);
    const before = heap();
    for (let i = 0; i < N; i++) keep[i] = make(i);
    const after = heap();
    return { value: (after - before - N * 8) / N, unit: "B/entity", keep };
  }

  // garbage per op: warm up, full GC, run WITHOUT collecting, read the delta
  function garbage(setup, op, iters) {
    const ctx = setup();
    for (let i = 0; i < 2000; i++) op(ctx, i);
    const before = heap();
    for (let i = 0; i < iters; i++) op(ctx, i);
    const dirty = process.memoryUsage().heapUsed;
    return { value: (dirty - before) / iters, unit: "B/op" };
  }

  // time per op: warm up, then a tight timed loop
  function timed(setup, op, iters) {
    const ctx = setup();
    for (let i = 0; i < 50_000; i++) op(ctx, i);
    const t0 = performance.now();
    for (let i = 0; i < iters; i++) op(ctx, i);
    return { value: ((performance.now() - t0) * 1e6) / iters, unit: "ns/op" };
  }

  const listened = (w) => {
    w.listen(() => {});
    return w;
  };

  const CASES = {
    // --- retained bytes ---------------------------------------------------
    "stream node": () => entity(() => new Stream(0)),
    "state() cell": () => entity(() => state(0)),
    "listen() edge": () => {
      const src = new Stream(0);
      return entity(() => src.listen(() => {}));
    },
    "map, asleep": () => {
      const src = new Stream(0);
      return entity(() => src.map((x) => x));
    },
    "map awake + listen": () => {
      const src = new Stream(0);
      return entity(() => {
        const m = src.map((x) => x);
        return [m, m.listen(() => {})];
      });
    },
    "hold node": () =>
      root(() => {
        const src = new Stream(0);
        return entity(() => src.hold(0));
      }),
    "accum node (fused)": () =>
      root(() => {
        const src = new Stream(0);
        return entity(() => src.accum(0, (a, b) => b));
      }),
    "combine awake + listen": () => {
      const a = state(0);
      const b = state(0);
      return entity(() => {
        const j = combine(a, b, (x, y) => x + y);
        return [j, j.updates.listen(() => {})];
      });
    },
    "selector cell": () =>
      root(() => {
        const sel = state(0);
        const isSel = selector(sel);
        return entity((i) => isSel(i));
      }),

    // --- garbage per op ----------------------------------------------------
    "garbage: set, 1 listener": () =>
      root(() =>
        garbage(
          () => listened(state(0)),
          (w, i) => w.set(i),
          300_000,
        ),
      ),
    "garbage: batch of 5 sets": () =>
      root(() =>
        garbage(
          () => Array.from({ length: 5 }, () => listened(state(0))),
          (ws, i) => batch(() => ws.forEach((w) => w.set(i))),
          200_000,
        ),
      ),
    "garbage: fire, 1 listener": () =>
      root(() =>
        garbage(
          () => listened(stream()),
          (s, i) => s.fire(i),
          300_000,
        ),
      ),
    "garbage: set through map x3": () =>
      root(() =>
        garbage(
          () => {
            const w = state(0);
            w.updates
              .map((x) => x)
              .map((x) => x)
              .map((x) => x)
              .listen(() => {});
            return w;
          },
          (w, i) => w.set(i),
          300_000,
        ),
      ),

    // --- time per op --------------------------------------------------------
    "time: set → flush → post": () =>
      root(() =>
        timed(
          () => listened(state(0)),
          (w, i) => w.set(i),
          5_000_000,
        ),
      ),
    "time: fire → flush → post": () =>
      root(() =>
        timed(
          () => listened(stream()),
          (s, i) => s.fire(i),
          5_000_000,
        ),
      ),
    "time: batch of 5 sets": () =>
      root(() =>
        timed(
          () => Array.from({ length: 5 }, () => listened(state(0))),
          (ws, i) => batch(() => ws.forEach((w) => w.set(i))),
          1_000_000,
        ),
      ),
    "time: sample()": () =>
      timed(
        () => state(42),
        (w) => w.sample(),
        10_000_000,
      ),
  };

  const run = CASES[CASE];
  if (!run) {
    console.error(`unknown case: ${CASE}`);
    process.exit(1);
  }
  const { value, unit } = run();
  console.log(JSON.stringify({ case: CASE, value, unit }));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Parent: run every case in its own isolate, print one table.
// ---------------------------------------------------------------------------

const ALL = [
  "stream node",
  "state() cell",
  "listen() edge",
  "map, asleep",
  "map awake + listen",
  "hold node",
  "accum node (fused)",
  "combine awake + listen",
  "selector cell",
  "garbage: set, 1 listener",
  "garbage: batch of 5 sets",
  "garbage: fire, 1 listener",
  "garbage: set through map x3",
  "time: set → flush → post",
  "time: fire → flush → post",
  "time: batch of 5 sets",
  "time: sample()",
];

const rows = [];
for (const c of ALL) {
  const res = spawnSync(process.execPath, ["--expose-gc", self], {
    env: { ...process.env, CORE_CASE: c },
    encoding: "utf8",
  });
  if (res.status !== 0) {
    console.error(`case "${c}" failed:\n${res.stderr}`);
    process.exit(1);
  }
  const lines = res.stdout.trim().split("\n");
  const { value, unit } = JSON.parse(lines[lines.length - 1]);
  rows.push({ case: c, value: Number(value.toFixed(1)), unit });
}
console.log("\n@continuum-js/frp — core µbench (isolated processes):\n");
console.table(rows);
