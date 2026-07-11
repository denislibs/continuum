import { stream, wire } from "@continuum-js/frp";

/**
 * The ten-line counter from §1.1. The component runs once; a click flows
 * into the FRP network, the `.on` transition folds it into the wire, and
 * exactly one text node is patched — no VDOM, no diffing, no component
 * re-run.
 */
export function Counter() {
  const clicks = stream<MouseEvent>();
  const count = wire(0).on(clicks, (n) => n + 1);
  return <button onClick={clicks.fire}>count: {count}</button>;
}
