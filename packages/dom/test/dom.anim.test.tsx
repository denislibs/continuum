import { describe, test, expect, vi, afterEach } from "vitest";
import { mount, animationFrames } from "@continuum-js/dom";
import { flushFrame } from "@continuum-js/frp";

afterEach(() => vi.unstubAllGlobals());

describe("animationFrames", () => {
  test("emits frame timestamps and cancels on unmount", () => {
    let cb: FrameRequestCallback | null = null;
    let nextId = 1;
    const canceled: number[] = [];
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      cb = fn;
      return nextId++;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => canceled.push(id));

    const container = document.createElement("div");
    const seen: number[] = [];
    const unmount = mount(container, () => {
      animationFrames().listen((t) => seen.push(t));
      return document.createComment("clock");
    });

    cb!(16);
    cb!(32);
    flushFrame();
    expect(seen).toEqual([16, 32]);

    unmount();
    // the loop's pending frame (the last id requested) was canceled; the
    // frame scheduler cancels its own requests as it flushes, so the list
    // holds those too
    expect(canceled).toContain(nextId - 1);
  });
});
