// onMount callbacks must run UNDER their owner: the documented composable
// anatomy — onMount(() => { …; onCleanup(teardown) }) — registers the
// teardown on the mounting scope. Before this fix flushMounts ran the
// callbacks ownerless, so the lifecycle guard threw (found in the wild by a
// dyn-inserted region whose onMount wired a window listener).
import { describe, test, expect } from "vitest";
import {
  mount,
  Show,
  onMount,
  onCleanup,
  provide,
  use,
  createContext,
} from "@continuum-js/dom";
import { newBehavior } from "@continuum-js/frp";

describe("onMount runs under its owner", () => {
  test("onCleanup inside onMount attaches to the component's scope", () => {
    let cleaned = 0;
    const container = document.createElement("div");
    const dispose = mount(container, () => {
      onMount(() => {
        onCleanup(() => cleaned++);
      });
      return <div>app</div>;
    });
    expect(cleaned).toBe(0);
    dispose();
    expect(cleaned).toBe(1);
  });

  test("the dyn-region path: mount hooks of a rebuilt region own their cleanups", () => {
    const [visible, setVisible] = newBehavior(false);
    let cleaned = 0;

    const container = document.createElement("div");
    const dispose = mount(container, () => (
      <Show when={visible}>
        {() => {
          onMount(() => {
            // the real-world shape: state a listener on mount, tear it down
            // with the region
            onCleanup(() => cleaned++);
          });
          return <span>region</span>;
        }}
      </Show>
    ));

    expect(() => setVisible(true)).not.toThrow(); // used to throw here
    expect(cleaned).toBe(0);
    setVisible(false); // the region is disposed → its mount-cleanup runs
    expect(cleaned).toBe(1);

    setVisible(true); // and a fresh region states a fresh cleanup
    setVisible(false);
    expect(cleaned).toBe(2);
    dispose();
  });

  test("context resolves inside onMount", () => {
    const ctx = createContext("default");
    let seen = "";
    const container = document.createElement("div");
    const dispose = mount(container, () => {
      provide(ctx, "provided");
      onMount(() => {
        seen = use(ctx);
      });
      return <div />;
    });
    expect(seen).toBe("provided");
    dispose();
  });
});
