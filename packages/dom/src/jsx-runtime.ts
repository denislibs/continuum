// Continuum — automatic JSX runtime.
// With `"jsx": "react-jsx"` + `"jsxImportSource": "@continuum-js/dom"`, the
// compiler auto-imports these, so components no longer need `import { h }`.
// They are thin adapters over `h`: the automatic runtime delivers children in
// `props.children`, whereas `h` takes them as rest arguments.

import { h, Fragment as Frag } from "./index.js";
import type { Child } from "./index.js";
import type { Behavior } from "@continuum-js/frp";

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
//
// Attribute values may always be a `Behavior<T>` in place of a plain `T` —
// the renderer live-binds them (`Reactive<T>`). Event props accept both
// native casing (`onKeydown`) and React-style casing (`onKeyDown`): the
// runtime lowercases the name before `addEventListener`, so the two are the
// same listener; the aliases below only teach the type system about it.

/** A plain value or a live-bound `Behavior` of it. */
type Reactive<T> = T | Behavior<T>;

/** Primitive attribute values the renderer knows how to apply. */
type AttrValue = string | number | boolean;

// String-typed DOM properties (`value`, `min`, …) also take numbers: the
// renderer assigns/stringifies, matching how the DOM itself coerces.
type AttrIn<T> = [T] extends [string] ? string | number : T;

/**
 * Element-specific attributes, derived from the DOM element interface:
 * its own all-lowercase primitive properties (`value`, `checked`, `href`,
 * `placeholder`, …). Camel-cased IDL names (`tabIndex`, `readOnly`) are
 * excluded — in JSX you write the real attribute name; the common ones are
 * declared explicitly in `SharedProps`.
 */
type DomProps<E> = {
  -readonly [
    P in keyof E as P extends string
      ? string extends P // drop index signatures (e.g. HTMLFormElement's)
        ? never
        : Lowercase<P> extends P
          ? [E[P]] extends [AttrValue]
            ? P
            : never
          : never
      : never
  ]?: Reactive<AttrIn<E[P]>>;
};

type EventHandler<Ev extends globalThis.Event> = (e: Ev) => void;

/** Every DOM event, in native casing: `onClick`, `onKeydown`, `onDblclick`… */
type NativeEventHandlers = {
  [
    K in keyof GlobalEventHandlersEventMap as `on${Capitalize<K>}`
  ]?: EventHandler<GlobalEventHandlersEventMap[K]>;
};

/** React-style casing for the multi-word events (same listener at runtime). */
interface AliasedEventHandlers {
  onKeyDown?: EventHandler<KeyboardEvent>;
  onKeyUp?: EventHandler<KeyboardEvent>;
  onKeyPress?: EventHandler<KeyboardEvent>;
  onMouseDown?: EventHandler<MouseEvent>;
  onMouseUp?: EventHandler<MouseEvent>;
  onMouseMove?: EventHandler<MouseEvent>;
  onMouseEnter?: EventHandler<MouseEvent>;
  onMouseLeave?: EventHandler<MouseEvent>;
  onMouseOver?: EventHandler<MouseEvent>;
  onMouseOut?: EventHandler<MouseEvent>;
  onDblClick?: EventHandler<MouseEvent>;
  onContextMenu?: EventHandler<MouseEvent>;
  onPointerDown?: EventHandler<PointerEvent>;
  onPointerUp?: EventHandler<PointerEvent>;
  onPointerMove?: EventHandler<PointerEvent>;
  onPointerEnter?: EventHandler<PointerEvent>;
  onPointerLeave?: EventHandler<PointerEvent>;
  onPointerOver?: EventHandler<PointerEvent>;
  onPointerOut?: EventHandler<PointerEvent>;
  onPointerCancel?: EventHandler<PointerEvent>;
  onTouchStart?: EventHandler<TouchEvent>;
  onTouchMove?: EventHandler<TouchEvent>;
  onTouchEnd?: EventHandler<TouchEvent>;
  onTouchCancel?: EventHandler<TouchEvent>;
  onFocusIn?: EventHandler<FocusEvent>;
  onFocusOut?: EventHandler<FocusEvent>;
  onBeforeInput?: EventHandler<InputEvent>;
  onCompositionStart?: EventHandler<CompositionEvent>;
  onCompositionUpdate?: EventHandler<CompositionEvent>;
  onCompositionEnd?: EventHandler<CompositionEvent>;
  onAnimationStart?: EventHandler<AnimationEvent>;
  onAnimationEnd?: EventHandler<AnimationEvent>;
  onAnimationIteration?: EventHandler<AnimationEvent>;
  onTransitionEnd?: EventHandler<TransitionEvent>;
  onDragStart?: EventHandler<DragEvent>;
  onDragEnd?: EventHandler<DragEvent>;
  onDragEnter?: EventHandler<DragEvent>;
  onDragLeave?: EventHandler<DragEvent>;
  onDragOver?: EventHandler<DragEvent>;
  onTimeUpdate?: EventHandler<globalThis.Event>;
  onDurationChange?: EventHandler<globalThis.Event>;
  onVolumeChange?: EventHandler<globalThis.Event>;
  onCanPlay?: EventHandler<globalThis.Event>;
  onLoadedData?: EventHandler<globalThis.Event>;
  onLoadedMetadata?: EventHandler<globalThis.Event>;
}

/** Attributes shared by every element, plus renderer-special props. */
interface SharedProps<E extends Element> {
  children?: Child;
  // The object form is deliberately wide: refs are commonly declared as
  // `{ current: HTMLElement | null }` and filled by the renderer.
  ref?: ((el: E) => void) | { current: Element | null };
  class?: Reactive<string>;
  className?: Reactive<string>;
  style?: Reactive<string | Partial<CSSStyleDeclaration>>;
  role?: Reactive<string>;
  // Attributes whose IDL property is camel-cased (excluded from DomProps):
  // in JSX you write the attribute itself.
  tabindex?: Reactive<number | string>;
  for?: Reactive<string>;
  readonly?: Reactive<boolean>;
  maxlength?: Reactive<number | string>;
  minlength?: Reactive<number | string>;
  colspan?: Reactive<number | string>;
  rowspan?: Reactive<number | string>;
  contenteditable?: Reactive<boolean | "true" | "false" | "plaintext-only">;
  [data: `data-${string}`]: Reactive<AttrValue> | undefined;
  [aria: `aria-${string}`]: Reactive<AttrValue> | undefined;
}

type HTMLProps<E extends HTMLElement> = DomProps<E> &
  SharedProps<E> &
  NativeEventHandlers &
  AliasedEventHandlers;

// SVG attributes rarely surface as IDL properties (`viewBox`, `cx`, `d`, …),
// so SVG stays permissive on attributes while keeping events/ref/class typed.
type SVGProps<E extends SVGElement> = SharedProps<E> &
  NativeEventHandlers &
  AliasedEventHandlers & { [attr: string]: unknown };

type IntrinsicHTML = {
  [K in keyof HTMLElementTagNameMap]: HTMLProps<HTMLElementTagNameMap[K]>;
};
type IntrinsicSVG = {
  [
    K in Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>
  ]: SVGProps<SVGElementTagNameMap[K]>;
};

export namespace JSX {
  export type Element = Node;
  export interface ElementChildrenAttribute {
    children: Record<string, never>;
  }
  export interface IntrinsicElements extends IntrinsicHTML, IntrinsicSVG {
    // Custom elements (a dash in the tag) accept arbitrary props.
    [custom: `${string}-${string}`]: Record<string, unknown> & {
      children?: Child;
    };
  }
}
