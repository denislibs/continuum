// Deterministic leak detection: instead of flaky heap deltas, count what a
// leak would actually do — invoke listeners of dead subtrees, keep timers
// ticking, accumulate DOM nodes. CI-safe by construction.
import { describe, test, expect, vi, afterEach } from "vitest";
import {
  mount,
  Show,
  Each,
  onCleanup,
  animationFrames,
} from "@continuum-js/dom";
import { newBehavior, type Behavior } from "@continuum-js/frp";
import { interval } from "@continuum-js/std";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("leak stress", () => {
  test("10k mount/unmount cycles leave no live listeners behind", () => {
    const [b, set] = newBehavior(0);
    let mapCalls = 0;
    const container = document.createElement("div");

    for (let i = 0; i < 10_000; i++) {
      const unmount = mount(container, () => (
        <span>{b.map((v) => (mapCalls++, v))}</span>
      ));
      unmount();
    }

    expect(container.childNodes.length).toBe(0);
    mapCalls = 0;
    set(1); // nobody should be listening anymore
    expect(mapCalls).toBe(0);
  });

  test("timers created per mount are all gone after unmount", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    let ticks = 0;

    for (let i = 0; i < 500; i++) {
      const unmount = mount(container, () => {
        const clock = interval(1000);
        onCleanup(() => clock.dispose());
        onCleanup(clock.listen(() => ticks++));
        return <span>t</span>;
      });
      unmount();
    }

    vi.advanceTimersByTime(60_000);
    expect(ticks).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("animationFrames loops are cancelled by unmount", () => {
    const pending = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++;
      pending.set(id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      pending.delete(id);
    });

    const container = document.createElement("div");
    for (let i = 0; i < 300; i++) {
      const unmount = mount(container, () => {
        animationFrames();
        return <span>a</span>;
      });
      unmount();
    }

    expect(pending.size).toBe(0);
  });

  test("10k Show toggles neither accumulate DOM nodes nor listeners", () => {
    const [flag, setFlag] = newBehavior(false);
    const [b, set] = newBehavior(0);
    let mapCalls = 0;
    const container = document.createElement("div");
    const unmount = mount(container, () => (
      <div>
        <Show when={flag}>
          {() => <span>{b.map((v) => (mapCalls++, v))}</span>}
        </Show>
      </div>
    ));

    const baseline = container.getElementsByTagName("*").length;
    for (let i = 0; i < 10_000; i++) setFlag(i % 2 === 0);
    // 10k-th toggle ends hidden (i=9999 → false)
    expect(container.getElementsByTagName("*").length).toBe(baseline);

    mapCalls = 0;
    set(1); // the hidden branch must not be listening
    expect(mapCalls).toBe(0);
    unmount();
  });

  test("keyed-list churn disposes removed rows completely", () => {
    const [items, setItems] = newBehavior<number[]>([]);
    const [b, set] = newBehavior(0);
    let mapCalls = 0;
    const container = document.createElement("div");
    const unmount = mount(container, () => (
      <ul>
        <Each each={items} by={(n: number) => n}>
          {(n: number) => <li>{b.map((v) => (mapCalls++, v + n))}</li>}
        </Each>
      </ul>
    ));

    // Rotate a 10-row window through 2000 generations of fresh keys.
    for (let g = 0; g < 2_000; g++) {
      setItems(Array.from({ length: 10 }, (_x, k) => g * 10 + k));
    }
    setItems([]);

    expect(container.querySelectorAll("li").length).toBe(0);
    mapCalls = 0;
    set(1); // 20k dead rows must not be listening
    expect(mapCalls).toBe(0);
    unmount();
  });

  test("a module-level behavior shared across remounts stays functional", () => {
    // The dispose cascade must not sever a *source* behavior: after churn,
    // a fresh mount still receives updates.
    const [b, set] = newBehavior(0);
    const container = document.createElement("div");
    for (let i = 0; i < 1_000; i++) {
      mount(container, () => <span>{b}</span>)();
    }
    const unmount = mount(container, () => <span class="live">{b}</span>);
    set(42);
    expect(container.querySelector(".live")!.textContent).toBe("42");
    unmount();
  });
});

describe("derivation lifecycle semantics", () => {
  test("a module-level derivation reused across mounts just works (sleeps and wakes)", () => {
    const [b, set] = newBehavior(0);
    const shared = b.map((v) => v + 1); // created once, outside any mount
    const container = document.createElement("div");
    mount(container, () => <span>{shared}</span>)(); // last listener leaves → node sleeps
    // Demand-driven activation: a second mount simply wakes the node —
    // the old "disposed after its last listener" trap is gone.
    const unmount = mount(container, () => <span class="live">{shared}</span>);
    set(41);
    expect(container.querySelector(".live")!.textContent).toBe("42");
    unmount();
  });

  test("retain() makes a shared derivation survive listener churn", () => {
    const [b, set] = newBehavior(0);
    const shared: Behavior<number> = b.map((v) => v + 1).retain();
    const container = document.createElement("div");
    for (let i = 0; i < 1_000; i++) {
      mount(container, () => <span>{shared}</span>)();
    }
    const unmount = mount(container, () => <span class="live">{shared}</span>);
    set(41);
    expect(container.querySelector(".live")!.textContent).toBe("42");
    unmount();
  });
});
