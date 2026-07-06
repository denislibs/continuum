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

const REPEAT = Number(process.env.BENCH_REPEAT ?? 10);
const WARMUP = Number(process.env.BENCH_WARMUP ?? 3);

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Click `sel` in-page and return the time until the next painted frame.
async function measureClick(page, sel) {
  return page.evaluate(async (s) => {
    const el = document.querySelector(s);
    if (!el) throw new Error(`missing element: ${s}`);
    const start = performance.now();
    el.click();
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );
    return performance.now() - start;
  }, sel);
}

async function clickAndSettle(page, sel, expectRows) {
  await page.evaluate((s) => document.querySelector(s).click(), sel);
  if (expectRows != null) {
    await page.waitForFunction(
      (n) => document.querySelectorAll("tbody tr").length === n,
      expectRows
    );
  }
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r()))
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
      "Playwright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium"
    );
    process.exit(1);
  }

  console.log("Building production bundle...");
  await build({ root, logLevel: "warn" });
  const server = await preview({ root, preview: { port: 0 } });
  const url =
    server.resolvedUrls?.local?.[0] ??
    `http://localhost:${server.httpServer.address().port}/`;

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error(
      "Could not launch Chromium. Install it with:\n  npx playwright install chromium\n",
      err.message
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
    const med = median(times);
    results.push({ operation: c.name, "median ms": Number(med.toFixed(2)) });
  }

  await browser.close();
  server.httpServer.close();

  console.log(
    `\nContinuum -- js-framework-benchmark (median of ${REPEAT} runs, ${WARMUP} warmups)\n`
  );
  console.table(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
