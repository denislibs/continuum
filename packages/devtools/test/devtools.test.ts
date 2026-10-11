// @continuum-js/devtools: strict layout mode (law 3) and the counters overlay.
import { describe, test, expect, afterEach, vi } from "vitest";
import {
  state,
  stream,
  root,
  flushFrame,
  requestMeasure,
  withLayout,
} from "@continuum-js/frp";
import { installDevtools, LAYOUT_CAUSES } from "@continuum-js/devtools";

let uninstall: (() => void) | null = null;
afterEach(() => {
  flushFrame();
  uninstall?.();
  uninstall = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("strict layout", () => {
  test("a layout read inside an effect is reported with the property name", () => {
    const violations: Error[] = [];
    uninstall = installDevtools({
      overlay: false,
      onViolation: (e) => violations.push(e),
    });
    const el = document.createElement("div");
    const s = state(0);
    s.updates.listen(() => void el.offsetHeight);
    s.set(1);
    flushFrame();
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toMatch(/offsetHeight/);
    expect(violations[0].message).toMatch(/measure|forceMeasure/);
  });

  test("a layout-forcing METHOD inside an effect is reported too", () => {
    const violations: Error[] = [];
    uninstall = installDevtools({
      overlay: false,
      onViolation: (e) => violations.push(e),
    });
    const el = document.createElement("input");
    document.body.appendChild(el);
    const s = state(0);
    s.updates.listen(() => el.focus());
    s.set(1);
    flushFrame();
    expect(violations.map((e) => e.message)).toEqual([
      expect.stringMatching(/focus/),
    ]);
  });

  test("the default handler throws (the error surfaces from the flush)", () => {
    uninstall = installDevtools({ overlay: false });
    const el = document.createElement("div");
    const s = state(0);
    s.updates.listen(() => void el.clientWidth);
    s.set(1);
    expect(() => flushFrame()).toThrow(/clientWidth/);
  });

  test("reads outside the pass, in measures and under withLayout are not violations", () => {
    const violations: Error[] = [];
    uninstall = installDevtools({
      overlay: false,
      onViolation: (e) => violations.push(e),
    });
    const el = document.createElement("div");
    void el.offsetHeight; // component-body-style read
    const s = state(0);
    s.updates.listen(() => withLayout(() => el.getBoundingClientRect()));
    s.set(1);
    requestMeasure(() => void el.scrollHeight);
    flushFrame();
    expect(violations).toEqual([]);
  });

  test("the patched getters still return the real values", () => {
    uninstall = installDevtools({ overlay: false });
    const el = document.createElement("div");
    document.body.appendChild(el);
    const native = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight",
    );
    expect(native).toBeDefined();
    expect(typeof el.offsetHeight).toBe("number");
    expect(typeof el.getBoundingClientRect().width).toBe("number");
  });

  test("uninstall restores the native descriptors", () => {
    const before = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight",
    )!.get;
    const beforeMethod = Element.prototype.getBoundingClientRect;
    uninstall = installDevtools({ overlay: false });
    expect(
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")!
        .get,
    ).not.toBe(before);
    uninstall();
    uninstall = null;
    expect(
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")!
        .get,
    ).toBe(before);
    expect(Element.prototype.getBoundingClientRect).toBe(beforeMethod);
  });

  test("installing twice is a no-op for the second call", () => {
    uninstall = installDevtools({ overlay: false });
    const again = installDevtools({ overlay: false });
    const patched = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight",
    )!.get;
    again(); // uninstalls the (single) installation
    expect(
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")!
        .get,
    ).not.toBe(patched);
    uninstall = null;
  });

  test("the cause list is the Paul Irish set", () => {
    expect(LAYOUT_CAUSES.HTMLElement.props).toContain("offsetHeight");
    expect(LAYOUT_CAUSES.Element.methods).toContain("getBoundingClientRect");
    expect(LAYOUT_CAUSES.window.methods).toContain("getComputedStyle");
  });
});

describe("overlay", () => {
  test("shows live counters and updates on a throttle", () => {
    vi.useFakeTimers();
    uninstall = installDevtools({ strictLayout: false });
    const panel = document.querySelector("[data-continuum-devtools]")!;
    expect(panel).not.toBeNull();
    root(() => {
      const s = stream<number>();
      s.listen(() => {});
      s.fire(1);
    });
    vi.advanceTimersByTime(600);
    const text = panel.textContent!;
    expect(text).toMatch(/scopes/i);
    expect(text).toMatch(/subscriptions/i);
    expect(text).toMatch(/moments/i);
  });

  test("counts layout violations", () => {
    vi.useFakeTimers();
    uninstall = installDevtools({ onViolation: () => {} });
    const el = document.createElement("div");
    const s = state(0);
    s.updates.listen(() => void el.offsetWidth);
    s.set(1);
    flushFrame();
    vi.advanceTimersByTime(600);
    const panel = document.querySelector("[data-continuum-devtools]")!;
    expect(panel.textContent).toMatch(/violations[^0-9]*1/i);
  });

  test("uninstall removes the panel", () => {
    uninstall = installDevtools({ strictLayout: false });
    uninstall();
    uninstall = null;
    expect(document.querySelector("[data-continuum-devtools]")).toBeNull();
  });
});
