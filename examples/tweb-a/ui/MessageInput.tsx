// Port of telegram-tt's MessageInput: a contenteditable under the frame
// pass. The state is the source of truth for drafts and clearing; the DOM
// is the source of truth while the user types. Rules that keep the caret
// where it belongs: write only when the content differs, never during an
// IME composition (apply once it ends).
import { type StateSource, type State } from "@continuum-js/frp";
import { onCleanup } from "@continuum-js/dom";

export function MessageInput(props: {
  html: StateSource<string>;
  onSend: () => void;
  placeholder: string | State<string>;
}): HTMLElement {
  // while an IME composition is in progress the DOM is the only truth:
  // external writes are skipped, and the composed text wins when it ends
  let composing = false;

  const el = (
    <div
      class="form-control allow-selection"
      contenteditable
      role="textbox"
      dir="auto"
      onInput={() => props.html.set(el.innerHTML)}
      onCompositionstart={() => {
        composing = true;
      }}
      onCompositionend={() => {
        composing = false;
      }}
      onKeydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          props.onSend();
        }
      }}
    />
  ) as HTMLDivElement;

  onCleanup(
    props.html.listen((h) => {
      if (composing) return;
      if (el.innerHTML !== h) el.innerHTML = h;
    }),
  );

  const isEmpty = props.html.map((h) => !h.trim());
  return (
    <div class="message-input-wrapper">
      <div
        class={isEmpty.map((e) =>
          e ? "placeholder-text" : "placeholder-text hidden",
        )}
      >
        {props.placeholder}
      </div>
      {el}
    </div>
  ) as HTMLElement;
}
