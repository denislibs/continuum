// Continuum — automatic JSX runtime (development variant).
// `jsxDEV` receives extra debug args (key, isStaticChildren, source, self);
// we ignore them and delegate to the production adapter.

import { jsx } from "./jsx-runtime.js";

export { Fragment, JSX } from "./jsx-runtime.js";

export function jsxDEV(
  type: unknown,
  props: Record<string, unknown> | null,
): Node {
  return jsx(type, props);
}
