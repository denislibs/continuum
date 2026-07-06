import { describe, test, expect, vi, afterEach } from "vitest";
import { mount, h } from "@continuum-js/dom";
import { TimeWarpDemo } from "./animation";

afterEach(() => vi.unstubAllGlobals());

describe("TimeWarpDemo", () => {
  test("the warped box moves twice as far as the real-time box", () => {
    let cb: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      cb = fn;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const container = document.createElement("div");
    mount(container, () => <TimeWarpDemo />);
    const boxes = container.querySelectorAll<HTMLElement>(".track > div");

    cb!(0); // baseline
    cb!(100); // +100ms

    // normal: 0.1 * 100 = 10px ; warped (2x): 0.1 * 200 = 20px
    expect(boxes[0].style.transform).toBe("translateX(10px)");
    expect(boxes[1].style.transform).toBe("translateX(20px)");
  });
});
