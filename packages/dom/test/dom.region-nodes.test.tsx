// #112: each/mount/portal used a build-time node snapshot to move/remove a
// subtree. When the subtree's root is a dynamic region (dyn/Show/each), that
// region swaps its content between its own markers on rebuild, staling the
// middle of the snapshot — leaving "ghost DOM" (orphaned live nodes, or a
// resurrected stale node) on move/remove/unmount. The fix sweeps the live
// range between the snapshot's (stable) first/last boundaries.
import { describe, test, expect, afterEach } from "vitest";
import { h, each, when, dyn, mount, portal } from "@continuum-js/dom";
import { root, state } from "@continuum-js/frp";

// Local render helper — avoids depending on @continuum-js/test, whose project
// reference back onto @continuum-js/dom would make `tsc -b` circular.
const cleanups: Array<() => void> = [];
function render(view: () => Node): { container: HTMLElement } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const unmount = mount(container, view);
  cleanups.push(() => {
    unmount();
    container.remove();
  });
  return { container };
}
afterEach(() => {
  for (const c of cleanups.splice(0)) c();
});

describe("region node tracking (#112)", () => {
  test("each removes the LIVE nodes when a row root is a dynamic region", () => {
    const items = state([{ id: 1 }, { id: 2 }]);
    const show = state(true);
    const { container } = render(() =>
      h(
        "ul",
        null,
        each(
          items,
          (i) => i.id,
          (i) =>
            i.id === 1
              ? when(
                  show,
                  () => h("li", null, "one"),
                  () => h("li", null, "ONE"),
                )
              : h("li", null, "two"),
        ),
      ),
    );
    expect(container.textContent).toBe("onetwo");
    show.set(false); // row 1's content is swapped by the nested region
    expect(container.textContent).toBe("ONEtwo");
    items.set([{ id: 2 }]); // remove row 1
    expect(container.textContent).toBe("two"); // not "ONEtwo"
  });

  test("each moves the LIVE nodes when a row root is a dynamic region", () => {
    const items = state([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const show = state(true);
    const { container } = render(() =>
      h(
        "ul",
        null,
        each(
          items,
          (i) => i.id,
          (i) =>
            i.id === 1
              ? when(
                  show,
                  () => h("li", null, "one"),
                  () => h("li", null, "ONE"),
                )
              : h("li", null, "r" + i.id),
        ),
      ),
    );
    expect(container.textContent).toBe("oner2r3");
    show.set(false);
    expect(container.textContent).toBe("ONEr2r3");
    items.set([{ id: 2 }, { id: 3 }, { id: 1 }]); // move row 1 to the end
    expect(container.textContent).toBe("r2r3ONE");
  });

  test("mount unmounts a top-level dynamic region's LIVE nodes", () => {
    const container = document.createElement("div");
    const b = state(1);
    const unmount = mount(container, () =>
      dyn(b, (v) => h("span", null, String(v))),
    );
    expect(container.textContent).toBe("1");
    b.set(2); // content swapped
    expect(container.textContent).toBe("2");
    unmount();
    expect(container.childNodes.length).toBe(0); // no ghost <span>2
  });

  test("portal removes a top-level dynamic region's LIVE nodes on dispose", () => {
    const target = document.createElement("div");
    root((dispose) => {
      const b = state(1);
      portal(
        target,
        dyn(b, (v) => h("span", null, String(v))),
      );
      expect(target.textContent).toBe("1");
      b.set(2);
      expect(target.textContent).toBe("2");
      dispose();
      expect(target.childNodes.length).toBe(0);
    });
  });
});
