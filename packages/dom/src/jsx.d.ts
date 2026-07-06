// Ambient JSX types for the Continuum renderer (classic `--jsxFactory h`).
// A JSX expression evaluates to a real DOM `Node`; intrinsic element props
// are intentionally loose in the prototype.

declare namespace JSX {
  type Element = Node;

  interface ElementChildrenAttribute {
    children: Record<string, never>;
  }

  interface IntrinsicElements {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [elem: string]: any;
  }
}
