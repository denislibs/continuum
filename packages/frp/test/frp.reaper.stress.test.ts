// Reaper stress (runs under `npm run stress` with --expose-gc): a stateful
// behavior (hold/accum) that became unreachable is detached from its source
// after garbage collection — the leak class "created, sampled, dropped,
// never listened" has a guaranteed end.
import { describe, test, expect } from "vitest";
import { newStream } from "@continuum-js/frp";

const gc = (globalThis as { gc?: () => void }).gc;

// A few GC rounds with macrotask gaps: FinalizationRegistry callbacks are
// delivered between tasks, not synchronously with the collection.
const collect = async () => {
  for (let i = 0; i < 5; i++) {
    gc!();
    await new Promise((r) => setTimeout(r, 0));
  }
};

describe.skipIf(!gc)(
  "reaper — dropped stateful behaviors detach after GC",
  () => {
    test("a dropped accum chain goes cold", async () => {
      const [src, fire] = newStream<number>();
      let calls = 0;
      (() => {
        src
          .map((x) => {
            calls++;
            return x;
          })
          .accum(0, (a, s) => s + a);
      })();
      fire(1);
      expect(calls).toBe(1); // eager while the wrapper is (possibly) reachable
      await collect();
      fire(2);
      expect(calls).toBe(1); // reaped: the lazy map upstream fell asleep
    });

    test("a kept hold survives collection, a dropped sibling does not", async () => {
      const [src, fire] = newStream<number>();
      let calls = 0;
      const mk = () =>
        src
          .map((x) => {
            calls++;
            return x;
          })
          .hold(0);
      mk(); // dropped immediately
      const kept = mk(); // stays reachable
      await collect();
      fire(7);
      expect(calls).toBe(1); // only the kept chain computed
      expect(kept.sample()).toBe(7); // and its value is exact
    });

    test("10k dropped accums do not accumulate on the source", async () => {
      const [src, fire] = newStream<number>();
      let calls = 0;
      for (let i = 0; i < 10_000; i++) {
        src
          .map((x) => {
            calls++;
            return x;
          })
          .accum(0, (a, s) => s + a);
      }
      await collect();
      fire(1);
      // Not asserting an exact zero: the engine only promises that collection
      // has an effect — a handful of stragglers pinned by the stack is fine.
      expect(calls).toBeLessThan(100);
    });
  },
);
