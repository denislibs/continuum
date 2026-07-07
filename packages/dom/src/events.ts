// React-style event aliases: the element parametrization lives in a named
// event type, annotated at the parameter — `(e: SubmitEvent<HTMLFormElement>)
// => …` — one type argument instead of EventHandler's two. Each alias is the
// NATIVE event (these shadow the DOM globals when imported, exactly like
// React's; the bare name still works thanks to the defaults). Types only.

/** Any native event narrowed to a concrete `currentTarget`. */
export type Targeted<Ev extends globalThis.Event, E extends Element> = Ev & {
  currentTarget: E;
};

export type MouseEvent<E extends Element = Element> = Targeted<
  globalThis.MouseEvent,
  E
>;
export type KeyboardEvent<E extends Element = Element> = Targeted<
  globalThis.KeyboardEvent,
  E
>;
export type PointerEvent<E extends Element = Element> = Targeted<
  globalThis.PointerEvent,
  E
>;
export type TouchEvent<E extends Element = Element> = Targeted<
  globalThis.TouchEvent,
  E
>;
export type WheelEvent<E extends Element = Element> = Targeted<
  globalThis.WheelEvent,
  E
>;
export type DragEvent<E extends Element = Element> = Targeted<
  globalThis.DragEvent,
  E
>;
export type FocusEvent<E extends Element = Element> = Targeted<
  globalThis.FocusEvent,
  E
>;
export type InputEvent<E extends Element = Element> = Targeted<
  globalThis.InputEvent,
  E
>;
export type CompositionEvent<E extends Element = Element> = Targeted<
  globalThis.CompositionEvent,
  E
>;
export type ClipboardEvent<E extends Element = Element> = Targeted<
  globalThis.ClipboardEvent,
  E
>;
export type AnimationEvent<E extends Element = Element> = Targeted<
  globalThis.AnimationEvent,
  E
>;
export type TransitionEvent<E extends Element = Element> = Targeted<
  globalThis.TransitionEvent,
  E
>;
export type UIEvent<E extends Element = Element> = Targeted<
  globalThis.UIEvent,
  E
>;
/** The only tag that submits is a form — hence the default. */
export type SubmitEvent<E extends Element = HTMLFormElement> = Targeted<
  globalThis.SubmitEvent,
  E
>;
