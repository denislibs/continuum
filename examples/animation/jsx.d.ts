// Ambient JSX types for examples (mirrors @continuum/dom's JSX namespace).
// A JSX expression evaluates to a real DOM `Node`.

declare namespace JSX {
  type Element = Node;

  interface ElementChildrenAttribute {
    children: Record<string, never>;
  }

  interface IntrinsicElements {
    [elem: string]: any;
  }
}
