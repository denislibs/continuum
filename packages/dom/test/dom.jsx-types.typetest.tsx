// Compile-time contract of the typed JSX surface. This file is checked by
// `tsc -b` (the tsconfig includes `test/`), NOT executed by vitest — every
// assertion here is a type-level one. `@ts-expect-error` lines pin what must
// NOT compile; the rest pins what must.
import { newBehavior, newEvent } from "@continuum-js/frp";
import { bindInput } from "@continuum-js/dom";

export function TypedEventHandlers() {
  const [clicks, fire] = newEvent<MouseEvent>();
  void clicks;
  return (
    <div>
      {/* the handler parameter is contextually typed from the tag */}
      <button onClick={(e) => e.clientX}>typed param</button>
      {/* an event source function plugs in directly */}
      <button onClick={fire}>source</button>
      {/* both React-style and native casing are typed (runtime lowercases) */}
      <input onKeyDown={(e) => e.key} />
      <input onKeydown={(e) => e.key} />
      <input onInput={(e) => e.target} />
      {/* @ts-expect-error a click handler cannot demand a KeyboardEvent */}
      <button onClick={(e: KeyboardEvent) => e}>bad handler</button>
    </div>
  );
}

export function ReactiveAttributes() {
  const [text, setText] = newBehavior("");
  const [checked] = newBehavior(false);
  return (
    <div class={text.map((t) => (t ? "filled" : "empty"))} data-test="ok">
      {/* bindInput's props spread onto a typed <input> */}
      <input {...bindInput(text, setText)} placeholder="type here" />
      {/* a Behavior is accepted wherever the plain value is */}
      <input value={text} readonly maxlength={10} />
      <input type="checkbox" checked={checked} />
      <label for="x">label</label>
      <div aria-hidden="true" role="note" tabindex={0} />
      {/* @ts-expect-error value is a string/number attribute, not boolean */}
      <input value={false} />
      {/* @ts-expect-error class is a string attribute */}
      <div class={42} />
    </div>
  );
}

export function TypedRefs() {
  return (
    <input
      ref={(el) => {
        // the ref parameter carries the tag's concrete element type
        const input: HTMLInputElement = el;
        void input;
      }}
    />
  );
}

export function SvgAndCustomElements() {
  return (
    <div>
      {/* SVG stays permissive (its attribute surface is huge) but events are typed */}
      <svg viewBox="0 0 10 10" onClick={(e) => e.clientX}>
        <circle cx={5} cy={5} r={4} />
      </svg>
      {/* custom elements (dash in the tag) accept arbitrary props */}
      <my-widget foo="bar" />
    </div>
  );
}
