// Local performance harness for the js-framework-benchmark table.
//
//   npm run bench            (from benchmark/, or `npm run bench` at root)
//
// Builds the app, serves the production bundle, drives each standard operation
// in a real Chromium via Playwright, and prints the median of:
//   script ms — synchronous JS time of the click handler (the honest number
//               for interactive ops that fit in a frame);
//   paint ms  — click → next painted frame (vsync-quantized for sub-frame
//               ops: see BASELINES.md);
//   alloc KB  — bytes allocated during the op (sampled via CDP HeapProfiler;
//               the GC-pressure number);
//   long tasks — main-thread tasks > 50 ms during the op (responsiveness).
// Numbers are only comparable across runs on the SAME machine — they are not
// the official krausest leaderboard numbers, which require his tuned harness
// and warmed browser.

import { launch, median, VARIANT } from "./harness.mjs";

const REPEAT = Number(process.env.BENCH_REPEAT ?? 10);
const WARMUP = Number(process.env.BENCH_WARMUP ?? 3);

// Click `sel` in-page; returns { paint, script, longTasks }.
async function measureClick(page, sel) {
  return page.evaluate(async (s) => {
    const el = document.querySelector(s);
    if (!el) throw new Error(`missing element: ${s}`);
    window.__longTasks = 0;
    const start = performance.now();
    el.click();
    const script = performance.now() - start;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    return {
      paint: performance.now() - start,
      script,
      longTasks: window.__longTasks,
    };
  }, sel);
}

// Total sampled allocation bytes in a HeapProfiler sampling profile.
function sampledBytes(node) {
  let sum = node.selfSize ?? 0;
  for (const c of node.children ?? []) sum += sampledBytes(c);
  return sum;
}

async function clickAndSettle(page, sel, expectRows) {
  await page.evaluate((s) => document.querySelector(s).click(), sel);
  if (expectRows != null) {
    await page.waitForFunction(
      (n) => document.querySelectorAll("tbody tr").length === n,
      expectRows,
    );
  }
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
}

const CASES = [
  { name: "create rows (1k)", action: "#run" },
  {
    name: "replace all rows (1k)",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "#run",
  },
  {
    name: "partial update (every 10th)",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "#update",
  },
  {
    name: "select row",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "tbody tr:first-child td.col-md-4 a",
  },
  {
    name: "swap rows",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "#swaprows",
  },
  {
    name: "remove row",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "tbody tr:first-child a.remove",
  },
  {
    name: "append rows (1k)",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "#add",
  },
  { name: "create many rows (10k)", action: "#runlots" },
  {
    name: "clear rows (1k)",
    setup: (p) => clickAndSettle(p, "#run", 1000),
    action: "#clear",
  },
];

async function main() {
  const { page, cdp, url, close } = await launch();
  await cdp.send("HeapProfiler.enable");
  // Long-task observer registered before the app loads on every navigation.
  await page.addInitScript(() => {
    window.__longTasks = 0;
    new PerformanceObserver((list) => {
      window.__longTasks += list.getEntries().length;
    }).observe({ type: "longtask", buffered: false });
  });

  const results = [];
  for (const c of CASES) {
    const runs = [];
    for (let i = 0; i < WARMUP + REPEAT; i++) {
      await page.goto(url);
      await page.waitForSelector("#run");
      if (c.setup) await c.setup(page);
      // sample allocations only around the measured click; the interval is
      // coarse (64 KB) to keep the sampling overhead out of script ms
      await cdp.send("HeapProfiler.startSampling", {
        samplingInterval: 65536,
      });
      const dur = await measureClick(page, c.action);
      const { profile } = await cdp.send("HeapProfiler.stopSampling");
      if (i >= WARMUP) runs.push({ ...dur, alloc: sampledBytes(profile.head) });
    }
    results.push({
      operation: c.name,
      "script ms": Number(median(runs.map((r) => r.script)).toFixed(2)),
      "paint ms": Number(median(runs.map((r) => r.paint)).toFixed(2)),
      "alloc KB": Number((median(runs.map((r) => r.alloc)) / 1024).toFixed(0)),
      "long tasks": median(runs.map((r) => r.longTasks)),
    });
  }

  await close();

  console.log(
    `\n${VARIANT} -- js-framework-benchmark (median of ${REPEAT} runs, ${WARMUP} warmups)\n`,
  );
  console.table(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
