// Shared plumbing for the browser benchmarks (bench, mem, heap, soak, fps):
// build the variant's production bundle, serve it, launch Chromium with a
// CDP session. Numbers from any of these are comparable only on the same
// machine, ideally within one session.

import { build, preview } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** BENCH_APP=continuum (default) | compiled | solid | vanilla */
export const VARIANT = process.env.BENCH_APP ?? "continuum";

async function buildConfig({ minify = true } = {}) {
  const buildOpts = minify ? undefined : { minify: false };
  if (VARIANT === "continuum")
    return { root, logLevel: "warn", build: buildOpts };
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
      build: buildOpts,
      plugins: [continuum(), ...(base.plugins ?? [])],
    };
  }
  const vroot = path.join(root, "variants", VARIANT);
  const cfg = {
    root: vroot,
    configFile: false,
    logLevel: "warn",
    build: buildOpts,
  };
  if (VARIANT === "solid") {
    const solid = (await import("vite-plugin-solid")).default;
    cfg.plugins = [solid()];
  }
  return cfg;
}

/**
 * Build + serve + launch. Returns { page, cdp, url, close }. Pass
 * `minify: false` when constructor names must survive (heap snapshots).
 */
export async function launch({ minify = true } = {}) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "Playwright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium",
    );
    process.exit(1);
  }

  console.log(
    `Building production bundle (${VARIANT}${minify ? "" : ", unminified"})...`,
  );
  const cfg = await buildConfig({ minify });
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
  const cdp = await page.context().newCDPSession(page);

  return {
    page,
    cdp,
    url,
    close: async () => {
      await browser.close();
      server.httpServer.close();
    },
  };
}

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Full GC via CDP, then JSHeapUsedSize in MB. */
export async function heapMB(page, cdp) {
  await page.waitForTimeout(120);
  for (let i = 0; i < 3; i++) await cdp.send("HeapProfiler.collectGarbage");
  await page.waitForTimeout(60);
  const { metrics } = await cdp.send("Performance.getMetrics");
  return metrics.find((m) => m.name === "JSHeapUsedSize").value / 1048576;
}

/** Live DOM nodes + JS event listeners (leak canaries the JS heap misses). */
export async function domCounters(cdp) {
  const { nodes, jsEventListeners } = await cdp.send("Memory.getDOMCounters");
  return { nodes, listeners: jsEventListeners };
}
