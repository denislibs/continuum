import { newEvent } from "@continuum/frp";
import { h } from "@continuum/dom";

/**
 * The ten-line counter from §1.1. The component runs once; a click flows
 * into the FRP network, `accum` updates the behavior, and exactly one text
 * node is patched — no VDOM, no diffing, no component re-run.
 */
export function Counter() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}
