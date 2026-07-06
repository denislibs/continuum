// Ambient JSX types for examples (mirrors @continuum/dom's JSX namespace).
// Kept local because ambient globals do not propagate across project
// references. A JSX expression evaluates to a real DOM `Node`.

declare namespace JSX {
  type Element = Node;

  interface ElementChildrenAttribute {
    children: Record<string, never>;
  }

  interface IntrinsicElements {
    [elem: string]: any;
  }
}
