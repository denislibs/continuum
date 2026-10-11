/** @jsxImportSource @continuum-js/dom */
// Spike bench: sync vs frame schedule on the same renderer. Prints the
// numbers the decision needs (region rebuilds, DOM writes, wall time).
// Run: npx vitest run benchmark/schedule.test.tsx
import { test, afterEach } from "vitest";
import { state, setSchedule, flushFrame } from "@continuum-js/frp";
import { mount, dyn, each } from "@continuum-js/dom";

afterEach(() => {
  flushFrame();
  setSchedule("sync");
  document.body.innerHTML = "";
});

type Row = { id: number; text: string };

function scenario(label: "sync" | "frame", updates: number, rows: number) {
  setSchedule(label);
  const items = state<Row[]>(
    Array.from({ length: rows }, (_, i) => ({ id: i, text: `row ${i}` })),
  );
  const selected = state(0);
  let regionBuilds = 0;
  let rowBuilds = 0;
  let textWrites = 0;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const unmount = mount(container, () => (
    <div>
      <p>{selected.map(String)}</p>
      {dyn(selected, (v) => {
        regionBuilds++;
        return <b>{String(v)}</b>;
      })}
      <ul>
        {each(
          items,
          (r) => r.id,
          (r) => {
            rowBuilds++;
            return <li>{r.text}</li>;
          },
        )}
      </ul>
    </div>
  ));
  // count writes to the static text binding's node
  const textNode = container.querySelector("p")!.firstChild!;
  const origData = Object.getOwnPropertyDescriptor(
    CharacterData.prototype,
    "data",
  )!;
  Object.defineProperty(textNode, "data", {
    set(v: string) {
      textWrites++;
      origData.set!.call(this, v);
    },
    get() {
      return origData.get!.call(this);
    },
    configurable: true,
  });
  regionBuilds = 0;
  rowBuilds = 0;

  const t0 = performance.now();
  for (let i = 1; i <= updates; i++) {
    // a burst between frames: counter + one appended row + one edited row
    selected.set(i);
    items.set([
      ...items
        .sample()
        .map((r, k) =>
          k === i % rows ? { id: r.id, text: `row ${r.id} v${i}` } : r,
        ),
      { id: rows + i, text: `new ${i}` },
    ]);
  }
  flushFrame();
  const ms = performance.now() - t0;
  unmount();
  return { label, ms: +ms.toFixed(2), regionBuilds, rowBuilds, textWrites };
}

test("sync vs frame: burst of updates between frames", () => {
  const out: Record<string, unknown>[] = [];
  for (const [updates, rows] of [
    [10, 100],
    [100, 500],
    [1000, 1000],
  ] as const) {
    // warm-up
    scenario("sync", 5, 10);
    scenario("frame", 5, 10);
    const s = scenario("sync", updates, rows);
    const f = scenario("frame", updates, rows);
    out.push({ updates, rows, ...s }, { updates, rows, ...f });
  }
  console.table(out);
});
