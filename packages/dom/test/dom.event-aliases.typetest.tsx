// Compile-time contract of the React-style event aliases: one type argument,
// annotated on the parameter — `(e: SubmitEvent<HTMLFormElement>) => …` —
// instead of the two-argument EventHandler on the const.
import type {
  SubmitEvent,
  MouseEvent,
  KeyboardEvent,
  InputEvent,
  FocusEvent,
  Targeted,
  Events,
} from "@continuum-js/dom";

export function NamespaceStyle() {
  // the namespace form: no shadowing of the DOM globals in the file
  const onSubmit = (e: Events.SubmitEvent) => e.currentTarget.elements;
  const onClick = (e: Events.MouseEvent<HTMLButtonElement>) =>
    e.currentTarget.type;
  const onPaste = (e: Events.Targeted<ClipboardEvent, HTMLInputElement>) =>
    e.currentTarget.value;
  return (
    <form onSubmit={onSubmit}>
      <input onPaste={onPaste} />
      <button onClick={onClick}>go</button>
    </form>
  );
}

export function ParamAnnotatedHandlers() {
  // the shape the aliases exist for: extracted handler, param-position type
  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("todo"); // typed, no cast
    void input;
  };
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const btn: HTMLButtonElement = e.currentTarget;
    void btn;
    void e.clientX;
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => e.key;
  const onType = (e: InputEvent<HTMLInputElement>) => e.currentTarget.value;
  const onBlur = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.value;

  return (
    <div>
      {/* extracted handlers plug into the matching tags */}
      <form onSubmit={onSubmit}>
        <input onKeyDown={onKey} onInput={onType} onBlur={onBlur} />
        <button onClick={onClick}>go</button>
      </form>
    </div>
  );
}

export function DefaultsAndEscapeHatch() {
  // the element argument is optional — bare aliases still work
  const anyClick = (e: MouseEvent) => e.clientX;
  // SubmitEvent defaults to HTMLFormElement — the only tag that submits
  const submit = (e: SubmitEvent) => e.currentTarget.elements;
  // Targeted covers any event/element pair without a named alias
  const custom = (e: Targeted<ClipboardEvent, HTMLTextAreaElement>) =>
    e.currentTarget.rows;
  void anyClick;
  void submit;
  void custom;
}

export function WrongElementIsAnError() {
  // a handler demanding a button cannot be attached to a form
  const onClick = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.type;
  return (
    <div>
      {/* @ts-expect-error currentTarget of a <form> is not a button */}
      <form onClick={onClick} />
    </div>
  );
}
