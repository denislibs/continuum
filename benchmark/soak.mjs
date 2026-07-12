// Soak harness: the long-session leak detector. One-shot checkpoints
// (bench:mem) miss a slow drip — 30 KB per interaction cycle is invisible
// after one clear but is 30 MB after an hour of real use. This drives
// create → update → swap → clear for N cycles and reports the heap TREND
// (KB per cycle, least squares over the post-warmup samples) plus the DOM
// node / listener drift.
//
//   BENCH_APP=continuum|compiled|solid|vanilla SOAK_CYCLES=60 npm run bench:soak
//
// A healthy engine trends ~0; a leak shows as a steady positive slope.

import { launch, heapMB, domCounters, VARIANT } from "./harness.mjs";

const CYCLES = Number(process.env.SOAK_CYCLES ?? 60);
const SAMPLE_EVERY = 5; // full GC per sample is slow — sample sparsely
const WARMUP_SAMPLES = 2; // JIT/caches settle over the first cycles

async function main() {
  const { page, cdp, url, close } = await launch();
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.enable");

  await page.goto(url);
  await page.waitForSelector("#run");

  const click = (sel) =>
    page.evaluate((s) => document.querySelector(s).click(), sel);
  const settle = (n) =>
    page.waitForFunction(
      (x) => document.querySelectorAll("tbody tr").length === x,
      n,
    );

  const samples = [];
  for (let i = 1; i <= CYCLES; i++) {
    await click("#run");
    await settle(1000);
    await click("#update");
    await click("#swaprows");
    await click("#clear");
    await settle(0);
    if (i % SAMPLE_EVERY === 0) {
      const heap = await heapMB(page, cdp);
      const dom = await domCounters(cdp);
      samples.push({ cycle: i, heapKB: heap * 1024, ...dom });
    }
  }

  const fit = samples.slice(WARMUP_SAMPLES);
  // least-squares slope of heapKB over cycle
  const n = fit.length;
  const mx = fit.reduce((s, p) => s + p.cycle, 0) / n;
  const my = fit.reduce((s, p) => s + p.heapKB, 0) / n;
  const slope =
    fit.reduce((s, p) => s + (p.cycle - mx) * (p.heapKB - my), 0) /
    fit.reduce((s, p) => s + (p.cycle - mx) ** 2, 0);

  const first = fit[0];
  const last = fit[n - 1];
  console.log(
    `\n${VARIANT} — soak, ${CYCLES} cycles of create/update/swap/clear:\n`,
  );
  console.table([
    {
      metric: "heap KB",
      [`cycle ${first.cycle}`]: Math.round(first.heapKB),
      [`cycle ${last.cycle}`]: Math.round(last.heapKB),
      "trend/cycle": Number(slope.toFixed(2)),
    },
    {
      metric: "DOM nodes",
      [`cycle ${first.cycle}`]: first.nodes,
      [`cycle ${last.cycle}`]: last.nodes,
      "trend/cycle": Number(
        ((last.nodes - first.nodes) / (last.cycle - first.cycle)).toFixed(2),
      ),
    },
    {
      metric: "listeners",
      [`cycle ${first.cycle}`]: first.listeners,
      [`cycle ${last.cycle}`]: last.listeners,
      "trend/cycle": Number(
        (
          (last.listeners - first.listeners) /
          (last.cycle - first.cycle)
        ).toFixed(2),
      ),
    },
  ]);
  if (slope > 5) {
    console.log(
      `⚠ heap grows ${slope.toFixed(1)} KB/cycle — that is a leak trend, ` +
        "take a bench:heap snapshot at SNAP_STATE=clear and look for survivors.",
    );
  }

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
