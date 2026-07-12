// Memory harness: JSHeapUsedSize after a full GC at the js-framework-benchmark
// checkpoints, plus the DOM leak canaries the JS heap misses — live DOM node
// and event-listener counts (detached-but-retained nodes show up here long
// before they dominate the heap).
//
//   BENCH_APP=continuum|compiled|solid|vanilla npm run bench:mem
//
// The GC and every metric go through CDP — `performance.memory` is quantized
// and useless here. Same caveat as bench.mjs: numbers are only comparable
// across runs on the SAME machine, ideally within one session.

import { launch, median, heapMB, domCounters, VARIANT } from "./harness.mjs";

const REPEAT = Number(process.env.BENCH_REPEAT ?? 3);

async function main() {
  const { page, cdp, url, close } = await launch();
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.enable");

  async function checkpoint() {
    const heap = await heapMB(page, cdp);
    const dom = await domCounters(cdp);
    return { heap, ...dom };
  }

  async function clickAndSettle(sel, n) {
    await page.click(sel);
    await page.waitForFunction(
      (x) => document.querySelectorAll("tbody tr").length === x,
      n,
    );
  }

  const checkpoints = ["ready", "create 1k", "create 10k", "clear after 10k"];
  const samples = Object.fromEntries(checkpoints.map((c) => [c, []]));
  for (let i = 0; i < REPEAT; i++) {
    await page.goto(url);
    await page.waitForSelector("#run");
    samples["ready"].push(await checkpoint());
    await clickAndSettle("#run", 1000);
    samples["create 1k"].push(await checkpoint());
    await clickAndSettle("#runlots", 10000);
    samples["create 10k"].push(await checkpoint());
    await page.click("#clear");
    await page.waitForFunction(
      () => document.querySelectorAll("tbody tr").length === 0,
    );
    samples["clear after 10k"].push(await checkpoint());
  }

  console.log(
    `\n${VARIANT} — heap after GC + DOM counters (median of ${REPEAT}):\n`,
  );
  console.table(
    checkpoints.map((c) => ({
      checkpoint: c,
      "heap MB": Number(median(samples[c].map((s) => s.heap)).toFixed(2)),
      "DOM nodes": median(samples[c].map((s) => s.nodes)),
      listeners: median(samples[c].map((s) => s.listeners)),
    })),
  );

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
