// Local performance harness for the js-framework-benchmark table.
//
//   npm run bench            (from benchmark/, or `npm run bench` at root)
//
// Builds the app, serves the production bundle, drives each standard operation
// in a real Chromium via Playwright, and prints the median wall-clock time
// (click -> painted, measured in-page). Numbers are only comparable across runs
// on the SAME machine -- they are not the official krausest leaderboard numbers,
// which require his tuned harness and warmed browser.

import { build, preview } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

// BENCH_APP=continuum (default) | solid | vanilla — same harness, same
// selectors, different implementation under test.
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
    // the Continuum app + our JSX compiler
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

const REPEAT = Number(process.env.BENCH_REPEAT ?? 10);
const WARMUP = Number(process.env.BENCH_WARMUP ?? 3);

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Click `sel` in-page; returns { paint, script }. `paint` is click → next
// painted frame (vsync-quantized: for sub-frame ops it measures the phase of
// the vsync clock, not the framework — see BASELINES.md). `script` is the
// synchronous JS time of the click handler — the honest number for
// interactive ops that fit in a frame.
async function measureClick(page, sel) {
  return page.evaluate(async (s) => {
    const el = document.querySelector(s);
    if (!el) throw new Error(`missing element: ${s}`);
    const start = performance.now();
    el.click();
    const script = performance.now() - start;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    return { paint: performance.now() - start, script };
  }, sel);
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
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "Playwright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium",
    );
    process.exit(1);
  }

  console.log(`Building production bundle (${VARIANT})...`);
  const cfg = await buildConfig();
  await build(cfg);
  const server = await preview({ ...cfg, preview: { port: 0 } });
  const url =
    server.resolvedUrls?.local?.[0] ??
    `http://localhost:${server.httpServer.address().port}/`;

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error(
      "Could not launch Chromium. Install it with:\n  npx playwright install chromium\n",
      err.message,
    );
    server.httpServer.close();
    process.exit(1);
  }

  const page = await browser.newPage();
  const results = [];

  for (const c of CASES) {
    const times = [];
    for (let i = 0; i < WARMUP + REPEAT; i++) {
      await page.goto(url);
      await page.waitForSelector("#run");
      if (c.setup) await c.setup(page);
      const dur = await measureClick(page, c.action);
      if (i >= WARMUP) times.push(dur);
    }
    results.push({
      operation: c.name,
      "script ms": Number(median(times.map((t) => t.script)).toFixed(2)),
      "paint ms": Number(median(times.map((t) => t.paint)).toFixed(2)),
    });
  }

  await browser.close();
  server.httpServer.close();

  console.log(
    `\nContinuum -- js-framework-benchmark (median of ${REPEAT} runs, ${WARMUP} warmups)\n`,
  );
  console.table(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
