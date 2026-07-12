// Continuum — the compiled-template runtime (PERF-PLAN phase 2).
//
// NOT a public authoring API: `@continuum-js/vite-plugin` compiles ordinary
// JSX into calls to this module. Creation of a static subtree becomes ONE
// `cloneNode(true)` of a template parsed once per call site; only the
// dynamic "holes" are bound afterwards, with exactly the same semantics as
// the runtime JSX factory (same insertChild/applyProp/applyEvent).
//
// The `innerHTML` below receives ONLY compiler-generated static template
// strings derived from the developer's own JSX — no runtime data ever
// reaches it (dynamic parts are holes, bound via DOM APIs).

import { insertChild, applyProp, applyEvent } from "./index.js";
import type { Child } from "./index.js";

/**
 * @internal Parse `html` once (lazily, on first instantiation) and return a
 * cloner. `<template>` parsing accepts table fragments (`<tr>`, `<td>`)
 * without a surrounding table — no foster-parenting pitfalls.
 */
export function tmpl(html: string): () => Element {
  let proto: Element | null = null;
  return () => {
    if (!proto) {
      const t = document.createElement("template");
      t.innerHTML = html;
      proto = t.content.firstChild as Element;
    }
    return proto.cloneNode(true) as Element;
  };
}

/** @internal Insert a dynamic child before `anchor` (append when null). */
export function insert(
  parent: Node,
  value: Child,
  anchor: Node | null = null,
): void {
  insertChild(parent, value, anchor);
}

/** @internal Bind one dynamic prop (wire, ref, style, value/checked, attr). */
export function prop(el: Element, key: string, value: unknown): void {
  applyProp(el, key, value);
}

/** @internal Bind one event handler (delegated when the type bubbles). */
export function event(el: Element, type: string, handler: EventListener): void {
  applyEvent(el, type, handler);
}
