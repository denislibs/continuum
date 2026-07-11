// Continuum — automatic JSX runtime.
// With `"jsx": "react-jsx"` + `"jsxImportSource": "@continuum-js/dom"`, the
// compiler auto-imports these, so components no longer need `import { h }`.
// They are thin adapters over `h`: the automatic runtime delivers children in
// `props.children`, whereas `h` takes them as rest arguments.

import { h, Fragment as Frag } from "./index.js";
import type { Child } from "./index.js";
import type { Wire } from "@continuum-js/frp";

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
// Attribute values may always be a `Wire<T>` in place of a plain `T` —
// the renderer live-binds them (`Reactive<T>`). Stream props accept both
// native casing (`onKeydown`) and React-style casing (`onKeyDown`): the
// runtime lowercases the name before `addEventListener`, so the two are the
// same listener; the aliases below only teach the type system about it.

/** A plain value or a live-bound `Wire` of it. */
export type Reactive<T> = T | Wire<T>;

/** A ref prop: callback (typed to the tag's element) or an object cell. */
export type Ref<E extends Element = Element> =
  ((el: E) => void) | { current: Element | null };

/**
 * Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
 * function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.
 */
export type ComponentProps<
  T extends keyof JSX.IntrinsicElements | ((props: never) => unknown),
> = T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : T extends (props: infer P) => unknown
    ? P
    : never;

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

/**
 * A handler whose `currentTarget` carries the tag's concrete element type —
 * the native-event answer to React's `MouseEvent<HTMLButtonElement>`:
 * `onSubmit` on a `<form>` gives `e.currentTarget: HTMLFormElement`, no cast.
 */
export type EventHandler<
  Ev extends globalThis.Event,
  E extends Element = Element,
> = (e: Ev & { currentTarget: E }) => void;

/** Every DOM event, in native casing: `onClick`, `onKeydown`, `onDblclick`… */
type NativeEventHandlers<E extends Element> = {
  [
    K in keyof GlobalEventHandlersEventMap as `on${Capitalize<K>}`
  ]?: EventHandler<GlobalEventHandlersEventMap[K], E>;
};

/** React-style casing for the multi-word events (same listener at runtime). */
interface AliasedEventHandlers<E extends Element> {
  onKeyDown?: EventHandler<KeyboardEvent, E>;
  onKeyUp?: EventHandler<KeyboardEvent, E>;
  onKeyPress?: EventHandler<KeyboardEvent, E>;
  onMouseDown?: EventHandler<MouseEvent, E>;
  onMouseUp?: EventHandler<MouseEvent, E>;
  onMouseMove?: EventHandler<MouseEvent, E>;
  onMouseEnter?: EventHandler<MouseEvent, E>;
  onMouseLeave?: EventHandler<MouseEvent, E>;
  onMouseOver?: EventHandler<MouseEvent, E>;
  onMouseOut?: EventHandler<MouseEvent, E>;
  onDblClick?: EventHandler<MouseEvent, E>;
  onContextMenu?: EventHandler<MouseEvent, E>;
  onPointerDown?: EventHandler<PointerEvent, E>;
  onPointerUp?: EventHandler<PointerEvent, E>;
  onPointerMove?: EventHandler<PointerEvent, E>;
  onPointerEnter?: EventHandler<PointerEvent, E>;
  onPointerLeave?: EventHandler<PointerEvent, E>;
  onPointerOver?: EventHandler<PointerEvent, E>;
  onPointerOut?: EventHandler<PointerEvent, E>;
  onPointerCancel?: EventHandler<PointerEvent, E>;
  onTouchStart?: EventHandler<TouchEvent, E>;
  onTouchMove?: EventHandler<TouchEvent, E>;
  onTouchEnd?: EventHandler<TouchEvent, E>;
  onTouchCancel?: EventHandler<TouchEvent, E>;
  onFocusIn?: EventHandler<FocusEvent, E>;
  onFocusOut?: EventHandler<FocusEvent, E>;
  onBeforeInput?: EventHandler<InputEvent, E>;
  onCompositionStart?: EventHandler<CompositionEvent, E>;
  onCompositionUpdate?: EventHandler<CompositionEvent, E>;
  onCompositionEnd?: EventHandler<CompositionEvent, E>;
  onAnimationStart?: EventHandler<AnimationEvent, E>;
  onAnimationEnd?: EventHandler<AnimationEvent, E>;
  onAnimationIteration?: EventHandler<AnimationEvent, E>;
  onTransitionEnd?: EventHandler<TransitionEvent, E>;
  onDragStart?: EventHandler<DragEvent, E>;
  onDragEnd?: EventHandler<DragEvent, E>;
  onDragEnter?: EventHandler<DragEvent, E>;
  onDragLeave?: EventHandler<DragEvent, E>;
  onDragOver?: EventHandler<DragEvent, E>;
  onTimeUpdate?: EventHandler<globalThis.Event, E>;
  onDurationChange?: EventHandler<globalThis.Event, E>;
  onVolumeChange?: EventHandler<globalThis.Event, E>;
  onCanPlay?: EventHandler<globalThis.Event, E>;
  onLoadedData?: EventHandler<globalThis.Event, E>;
  onLoadedMetadata?: EventHandler<globalThis.Event, E>;
}

/** Attributes shared by every element, plus renderer-special props. */
interface SharedProps<E extends Element> {
  children?: Child;
  // The object form is deliberately wide: refs are commonly declared as
  // `{ current: HTMLElement | null }` and filled by the renderer.
  ref?: Ref<E>;
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
  NativeEventHandlers<E> &
  AliasedEventHandlers<E>;

// SVG attributes rarely surface as IDL properties (`viewBox`, `cx`, `d`, …),
// so SVG stays permissive on attributes while keeping events/ref/class typed.
type SVGProps<E extends SVGElement> = SharedProps<E> &
  NativeEventHandlers<E> &
  AliasedEventHandlers<E> & { [attr: string]: unknown };

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
