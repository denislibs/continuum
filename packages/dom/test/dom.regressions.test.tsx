// Audit-4 regressions: the when/Show condition leak and the style={} stale
// keys. Both were found by executable probes (see REFACTOR-PLAN, independent
// track).
import { describe, test, expect } from "vitest";
import { wire } from "@continuum-js/frp";
import { mount, when, h } from "@continuum-js/dom";

describe("when/Show release the condition chain on unmount", () => {
  test("after unmounts, the condition's map chain sleeps", () => {
    const flag = wire(false);
    let mapCalls = 0;
    // a module-level condition shared across mounts
    const cond = flag.map((v) => {
      mapCalls++;
      return v;
    });

    for (let i = 0; i < 3; i++) {
      const el = document.createElement("div");
      const unmount = mount(el, () =>
        when(
          cond,
          () => h("span", null, "on"),
          () => h("span", null, "off"),
        ),
      );
      unmount();
    }

    mapCalls = 0;
    flag.set(true);
    expect(mapCalls).toBe(0); // everything detached — the chain is asleep

    // and a FOURTH mount still works (the chain wakes again)
    const el = document.createElement("div");
    const unmount = mount(el, () =>
      when(
        cond,
        () => h("span", null, "on"),
        () => h("span", null, "off"),
      ),
    );
    expect(el.textContent).toBe("on");
    flag.set(false);
    expect(el.textContent).toBe("off");
    unmount();
  });
});

describe("style={wire} clears keys that disappear", () => {
  test("a dropped property is removed, not left behind", () => {
    const style = wire<Record<string, string>>({ color: "red" });
    const el = document.createElement("div");
    const unmount = mount(el, () => h("div", { style }));
    const target = el.firstChild as HTMLElement;
    expect(target.style.color).toBe("red");
    style.set({ fontWeight: "bold" });
    expect(target.style.color).toBe(""); // gone with the key
    expect(target.style.fontWeight).toBe("bold");
    style.set({});
    expect(target.style.fontWeight).toBe("");
    unmount();
  });
});
