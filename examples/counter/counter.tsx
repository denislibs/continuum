import { newStream } from "@continuum-js/frp";

/**
 * The ten-line counter from §1.1. The component runs once; a click flows
 * into the FRP network, `accum` updates the behavior, and exactly one text
 * node is patched — no VDOM, no diffing, no component re-run.
 */
export function Counter() {
  const [clicks, fire] = newStream<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);
  return <button onClick={fire}>count: {count}</button>;
}
