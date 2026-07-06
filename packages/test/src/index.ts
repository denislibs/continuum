// Continuum test utilities — render/cleanup, event helpers, async helpers.
// Framework-agnostic except `advanceTimers`, which integrates with vitest's
// fake timers (vitest is an optional peer, imported lazily).

import { mount, type Child } from "@continuum-js/dom";

/** A mounted view under test. */
export interface RenderResult {
  /** The container element, attached to `document.body`. */
  container: HTMLElement;
  /** Unmount the view (cascading FRP/ownership cleanup) and drop the container. */
  dispose: () => void;
}

const live = new Set<() => void>();

/**
 * Mount `view` into a fresh container appended to `document.body` (so focus
 * and event bubbling behave like in a real page). Dispose manually, or let
 * `cleanup()` collect everything at the end of the test.
 */
export function render(view: () => Child): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const unmount = mount(container, () => view() as Node);
  const dispose = () => {
    live.delete(dispose);
    unmount();
    container.remove();
  };
  live.add(dispose);
  return { container, dispose };
}

/** Dispose every view still mounted by `render`. Call from `afterEach`. */
export function cleanup(): void {
  for (const dispose of [...live]) dispose();
}

/** Dispatch `event` on `el`. Returns the `dispatchEvent` result. */
export function fire(el: EventTarget, event: Event): boolean {
  return el.dispatchEvent(event);
}

/** Click an element (a bubbling, cancelable MouseEvent). */
export function click(el: EventTarget): boolean {
  return fire(el, new MouseEvent("click", { bubbles: true, cancelable: true }));
}

/**
 * Type `text` into an input character by character, dispatching a bubbling
 * `input` event after each one — the shape `bindInput` listens to.
 */
export function type(input: HTMLInputElement, text: string): void {
  for (const ch of text) {
    input.value += ch;
    fire(input, new Event("input", { bubbles: true }));
  }
}

/**
 * Drain the microtask queue so settled promises (e.g. `perform` results)
 * re-enter the network. Transactions themselves are synchronous — this only
 * waits for the JS runtime, not for Continuum.
 */
export async function flush(rounds = 3): Promise<void> {
  for (let i = 0; i < rounds; i++) await Promise.resolve();
}

/**
 * Advance vitest fake timers by `ms` and flush microtasks, so time-based
 * combinators (`debounce`, `throttle`, `interval`, `delay`) fire and their
 * downstream settles. Requires `vi.useFakeTimers()` in the test.
 */
export async function advanceTimers(ms: number): Promise<void> {
  const { vi } = await import("vitest");
  await vi.advanceTimersByTimeAsync(ms);
  await flush();
}
