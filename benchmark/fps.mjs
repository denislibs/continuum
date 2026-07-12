// Frame harness: smoothness under CONTINUOUS load — the number the one-shot
// ops in bench.mjs cannot show. With 10k rows on screen, partial updates
// fire every UPDATE_MS for FPS_SECONDS; a rAF loop records every frame
// delta. Reported: effective FPS, median/p95/max frame time, and dropped
// frames (delta > 1.5 vsync intervals — a visible hitch).
//
//   BENCH_APP=continuum|compiled|solid|vanilla npm run bench:fps
//   UPDATE_MS=50 FPS_SECONDS=5 to tune the load.

import { launch, VARIANT } from "./harness.mjs";

const UPDATE_MS = Number(process.env.UPDATE_MS ?? 50);
const SECONDS = Number(process.env.FPS_SECONDS ?? 5);

async function main() {
  const { page, url, close } = await launch();

  await page.goto(url);
  await page.waitForSelector("#run");
  await page.click("#runlots");
  await page.waitForFunction(
    () => document.querySelectorAll("tbody tr").length === 10000,
  );
  await page.waitForTimeout(300); // let the initial paint settle

  const stats = await page.evaluate(
    ([updateMs, seconds]) =>
      new Promise((resolve) => {
        const update = document.querySelector("#update");
        const deltas = [];
        let prev = performance.now();
        let raf = 0;
        const tick = (now) => {
          deltas.push(now - prev);
          prev = now;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        const load = setInterval(() => update.click(), updateMs);
        setTimeout(() => {
          clearInterval(load);
          cancelAnimationFrame(raf);
          deltas.shift(); // the first delta spans the setup
          deltas.sort((a, b) => a - b);
          const at = (q) =>
            deltas[Math.min(deltas.length - 1, (deltas.length * q) | 0)];
          const vsync = at(0.5) < 9 ? 8.33 : 16.67; // 120 vs 60 Hz display
          resolve({
            frames: deltas.length,
            fps: 1000 / (deltas.reduce((s, d) => s + d, 0) / deltas.length),
            median: at(0.5),
            p95: at(0.95),
            max: deltas[deltas.length - 1],
            dropped: deltas.filter((d) => d > vsync * 1.5).length,
            vsync,
          });
        }, seconds * 1000);
      }),
    [UPDATE_MS, SECONDS],
  );

  console.log(
    `\n${VARIANT} — ${SECONDS}s of partial updates every ${UPDATE_MS}ms over 10k rows ` +
      `(${stats.vsync.toFixed(1)}ms vsync):\n`,
  );
  console.table([
    {
      fps: Number(stats.fps.toFixed(1)),
      "median frame ms": Number(stats.median.toFixed(2)),
      "p95 frame ms": Number(stats.p95.toFixed(2)),
      "max frame ms": Number(stats.max.toFixed(2)),
      [`dropped of ${stats.frames}`]: stats.dropped,
    },
  ]);

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
