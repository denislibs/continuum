// Memory harness: JSHeapUsedSize after a full GC at the js-framework-benchmark
// checkpoints (ready / create 1k / create 10k / clear). The GC and the metric
// go through CDP — `performance.memory` is quantized and useless here.
//
//   BENCH_APP=continuum|compiled|solid|vanilla npm run bench:mem
//
// Same caveat as bench.mjs: numbers are only comparable across runs on the
// SAME machine, ideally within one session.

import { build, preview } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const VARIANT = process.env.BENCH_APP ?? "continuum";

async function buildConfig() {
  if (VARIANT === "continuum") return { root, logLevel: "warn" };
  const vroot = path.join(root, "variants", VARIANT);
  const cfg = { root: vroot, configFile: false, logLevel: "warn" };
  if (VARIANT === "solid") {
    const solid = (await import("vite-plugin-solid")).default;
    cfg.plugins = [solid()];
  }
  if (VARIANT === "compiled") {
    const continuum = (await import("../packages/vite-plugin/dist/index.js"))
      .default;
    const base = (await import("./vite.config.ts")).default;
    return {
      ...base,
      root,
      configFile: false,
      logLevel: "warn",
      plugins: [continuum(), ...(base.plugins ?? [])],
    };
  }
  return cfg;
}

const REPEAT = Number(process.env.BENCH_REPEAT ?? 3);

const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

async function main() {
  const { chromium } = await import("playwright");
  console.log(`Building production bundle (${VARIANT})...`);
  const cfg = await buildConfig();
  await build(cfg);
  const server = await preview({ ...cfg, preview: { port: 0 } });
  const url =
    server.resolvedUrls?.local?.[0] ??
    `http://localhost:${server.httpServer.address().port}/`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.enable");

  async function heapMB() {
    await page.waitForTimeout(120);
    for (let i = 0; i < 3; i++) await cdp.send("HeapProfiler.collectGarbage");
    await page.waitForTimeout(60);
    const { metrics } = await cdp.send("Performance.getMetrics");
    return metrics.find((m) => m.name === "JSHeapUsedSize").value / 1048576;
  }

  async function clickAndSettle(sel, n) {
    await page.click(sel);
    await page.waitForFunction(
      (x) => document.querySelectorAll("tbody tr").length === x,
      n,
    );
  }

  const rows = {
    ready: [],
    "create 1k": [],
    "create 10k": [],
    "clear after 10k": [],
  };
  for (let i = 0; i < REPEAT; i++) {
    await page.goto(url);
    await page.waitForSelector("#run");
    rows["ready"].push(await heapMB());
    await clickAndSettle("#run", 1000);
    rows["create 1k"].push(await heapMB());
    await clickAndSettle("#runlots", 10000);
    rows["create 10k"].push(await heapMB());
    await page.click("#clear");
    await page.waitForFunction(
      () => document.querySelectorAll("tbody tr").length === 0,
    );
    rows["clear after 10k"].push(await heapMB());
  }

  console.log(
    `\n${VARIANT} — JSHeapUsedSize after GC (MB, median of ${REPEAT}):\n`,
  );
  console.table(
    Object.entries(rows).map(([checkpoint, xs]) => ({
      checkpoint,
      "heap MB": Number(median(xs).toFixed(2)),
    })),
  );

  await browser.close();
  server.httpServer.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
