import { describe, test, expect, vi, afterEach } from "vitest";
import { mount, animationFrames } from "@continuum-js/dom";

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
    expect(seen).toEqual([16, 32]);

    unmount();
    expect(canceled.length).toBe(1); // the pending frame was canceled
  });
});
