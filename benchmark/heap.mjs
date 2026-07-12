// Heap audit harness: a CDP heap snapshot at a js-framework-benchmark
// checkpoint, aggregated by constructor — WHO holds the bytes, not just how
// many (that is `bench:mem`). Builds WITHOUT minification so class names
// survive; object sizes do not depend on identifier length.
//
//   BENCH_APP=continuum|solid|vanilla SNAP_STATE=10k|clear npm run bench:heap
//
// Same caveat as bench.mjs: numbers are comparable only on the same machine,
// ideally within one session.

import { launch, VARIANT } from "./harness.mjs";

const STATE = process.env.SNAP_STATE ?? "10k"; // 10k | clear
const TOP = Number(process.env.SNAP_TOP ?? 25);

async function main() {
  const { page, cdp, url, close } = await launch({ minify: false });
  await cdp.send("HeapProfiler.enable");

  await page.goto(url);
  await page.waitForSelector("#run");
  await page.click("#runlots");
  await page.waitForFunction(
    () => document.querySelectorAll("tbody tr").length === 10000,
  );
  if (STATE === "clear") {
    await page.click("#clear");
    await page.waitForFunction(
      () => document.querySelectorAll("tbody tr").length === 0,
    );
  }
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) await cdp.send("HeapProfiler.collectGarbage");
  await page.waitForTimeout(100);

  const chunks = [];
  cdp.on("HeapProfiler.addHeapSnapshotChunk", (e) => chunks.push(e.chunk));
  await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });
  const snap = JSON.parse(chunks.join(""));

  const meta = snap.snapshot.meta;
  const F = meta.node_fields.length;
  const TYPE = meta.node_fields.indexOf("type");
  const NAME = meta.node_fields.indexOf("name");
  const SIZE = meta.node_fields.indexOf("self_size");
  const types = meta.node_types[TYPE];
  const { nodes, strings } = snap;

  const agg = new Map();
  for (let i = 0; i < nodes.length; i += F) {
    const t = types[nodes[i + TYPE]];
    const name = strings[nodes[i + NAME]];
    const key = `${t}:${t === "object" || t === "closure" ? name : ""}`;
    const cur = agg.get(key) ?? { count: 0, bytes: 0 };
    cur.count++;
    cur.bytes += nodes[i + SIZE];
    agg.set(key, cur);
  }
  const rows = [...agg.entries()]
    .map(([what, v]) => ({
      what,
      count: v.count,
      KB: Number((v.bytes / 1024).toFixed(1)),
    }))
    .sort((a, b) => b.KB - a.KB)
    .slice(0, TOP);

  console.log(`\n${VARIANT} / ${STATE} — self-size by constructor:\n`);
  console.table(rows);

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
