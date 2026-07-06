// Continuum — automatic JSX runtime.
// With `"jsx": "react-jsx"` + `"jsxImportSource": "@continuum/dom"`, the
// compiler auto-imports these, so components no longer need `import { h }`.
// They are thin adapters over `h`: the automatic runtime delivers children in
// `props.children`, whereas `h` takes them as rest arguments.

import { h, Fragment as Frag } from "./index";
import type { Child } from "./index";

export const Fragment = Frag;

type RuntimeProps = { children?: Child } & Record<string, unknown>;

function build(type: unknown, props: RuntimeProps | null): Node {
  const { children, ...rest } = props ?? {};
  const kids: Child[] =
    children === undefined
      ? []
      : Array.isArray(children)
      ? children
      : [children];
  return h(type as never, rest, ...kids);
}

/** Single/no static child. */
export function jsx(type: unknown, props: RuntimeProps | null): Node {
  return build(type, props);
}

/** Multiple static children (children is an array). */
export function jsxs(type: unknown, props: RuntimeProps | null): Node {
  return build(type, props);
}

// JSX type surface (resolved by the compiler from `<jsxImportSource>/jsx-runtime`).
export namespace JSX {
  export type Element = Node;
  export interface ElementChildrenAttribute {
    children: Record<string, never>;
  }
  export interface IntrinsicElements {
    [elem: string]: any;
  }
}
