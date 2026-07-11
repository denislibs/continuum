/// <reference types="node" />
// Heap-level leak stress (ROADMAP v0.6 «Долгосрочная устойчивость»).
// Needs --expose-gc: run via `npm run stress`. Skipped silently in a normal
// vitest run / CI — heap numbers are environment-sensitive by nature, so the
// deterministic listener-count tests in dom.leaks.test.tsx are the CI net,
// and this file is the local safety harness for absolute memory growth.
import { describe, test, expect } from "vitest";
import { mount, Show, Each, onCleanup } from "@continuum-js/dom";
import { newBehavior } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";
import { memoryUsage } from "node:process";

const gc = (globalThis as { gc?: () => void }).gc;

async function heapAfterGc(): Promise<number> {
  // Several gc+task rounds: FinalizationRegistry callbacks (the frp reaper)
  // are delivered between event-loop tasks, so a purely synchronous loop
  // piles their queue up — let it drain before measuring.
  for (let i = 0; i < 5; i++) {
    gc!();
    await new Promise((r) => setTimeout(r, 0));
  }
  return memoryUsage().heapUsed;
}

// A representative little app: state, a derived binding, a conditional
// region, a keyed list, a timer with explicit cleanup.
function App() {
  const [n, setN] = newBehavior(0);
  const [items] = newBehavior([1, 2, 3, 4, 5]);
  const clock = interval(60_000);
  onCleanup(() => clock.dispose());
  setN(1);
  return (
    <div>
      <span>{n.map((v) => v * 2)}</span>
      <Show when={n}>{(v) => <b>{v}</b>}</Show>
      <ul>
        <Each each={items} by={(i: number) => i}>
          {(i: number) => <li>{n.map((v) => v + i)}</li>}
        </Each>
      </ul>
    </div>
  );
}

describe.skipIf(!gc)("heap stress (--expose-gc)", () => {
  test("10k mount/unmount cycles keep heap growth under 5 MB", async () => {
    const container = document.createElement("div");
    const cycle = () => mount(container, () => <App />)();

    for (let i = 0; i < 2_000; i++) cycle(); // warmup: caches, JIT, shapes
    const baseline = await heapAfterGc();

    for (let i = 0; i < 10_000; i++) cycle();
    const grown = (await heapAfterGc()) - baseline;

    // A single leaked listener closure is ~100+ bytes; 10k cycles of any
    // per-cycle leak lands in megabytes. 5 MB absorbs jsdom/V8 noise.
    expect(grown).toBeLessThan(5 * 1024 * 1024);
  }, 120_000);
});
