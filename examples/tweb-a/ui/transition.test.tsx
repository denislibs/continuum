/** @jsxImportSource @continuum-js/dom */
// Transition: the leaving layer stays alive (bindings included) until its
// transition ends — not a frame earlier — and the switch counts as a heavy
// animation while it runs.
import { describe, test, expect, afterEach, vi } from "vitest";
import { state, flushFrame } from "@continuum-js/frp";
import { mount, onCleanup } from "@continuum-js/dom";
import { isHeavyAnimating } from "@continuum-js/dom/layout";
import { Transition } from "./Transition.js";

const unmounts: Array<() => void> = [];
afterEach(() => {
  flushFrame();
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function mountInBody(view: () => Node): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  unmounts.push(mount(c, view));
  return c;
}

describe("Transition", () => {
  test("renders the active layer; a key change adds the new layer and keeps the old one alive", () => {
    vi.useFakeTimers();
    const key = state(1);
    const text = state("one");
    const cleaned: number[] = [];
    const c = mountInBody(() => (
      <Transition activeKey={key} name="slide">
        {(k) => {
          onCleanup(() => cleaned.push(k));
          return <p>{k === 1 ? text : `layer ${k}`}</p>;
        }}
      </Transition>
    ));
    expect(c.querySelectorAll(".Transition_slide").length).toBe(1);
    expect(c.textContent).toBe("one");

    key.set(2);
    flushFrame();
    const layers = c.querySelectorAll(".Transition_slide");
    expect(layers.length).toBe(2); // both in the DOM during the animation
    expect(layers[0].classList.contains("Transition_slide-from")).toBe(true);
    expect(isHeavyAnimating.sample()).toBe(true);
    expect(cleaned).toEqual([]); // the old layer is NOT disposed yet …
    text.set("one, still live");
    flushFrame();
    expect(layers[0].textContent).toBe("one, still live"); // … its bindings still run

    layers[0].dispatchEvent(new Event("transitionend"));
    flushFrame();
    expect(c.querySelectorAll(".Transition_slide").length).toBe(1);
    expect(cleaned).toEqual([1]); // disposed exactly once, after the end
    expect(isHeavyAnimating.sample()).toBe(false);
  });

  test("a second switch mid-animation drops the middle layer cleanly", () => {
    vi.useFakeTimers();
    const key = state(1);
    const cleaned: number[] = [];
    const c = mountInBody(() => (
      <Transition activeKey={key} name="fade">
        {(k) => {
          onCleanup(() => cleaned.push(k));
          return <p>{`layer ${k}`}</p>;
        }}
      </Transition>
    ));
    key.set(2);
    flushFrame();
    key.set(3);
    flushFrame();
    // layer 2 never finished entering: it is disposed when superseded
    expect(cleaned).toContain(2);
    for (const l of Array.from(c.querySelectorAll(".Transition_slide-from")))
      l.dispatchEvent(new Event("transitionend"));
    flushFrame();
    expect(c.querySelectorAll(".Transition_slide").length).toBe(1);
    expect(c.textContent).toBe("layer 3");
    expect(cleaned.sort()).toEqual([1, 2]);
  });

  test("unmounting disposes every layer", () => {
    const key = state(1);
    const cleaned: number[] = [];
    mountInBody(() => (
      <Transition activeKey={key} name="fade">
        {(k) => {
          onCleanup(() => cleaned.push(k));
          return <p />;
        }}
      </Transition>
    ));
    key.set(2);
    flushFrame();
    unmounts.pop()!();
    expect(cleaned.sort()).toEqual([1, 2]);
  });
});
