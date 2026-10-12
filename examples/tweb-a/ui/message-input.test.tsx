/** @jsxImportSource @continuum-js/dom */
// MessageInput: a contenteditable under the frame pass. External writes
// land only when the content differs (no caret clobbering while typing),
// never during an IME composition.
import { describe, test, expect, afterEach } from "vitest";
import { state, flushFrame } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";
import { MessageInput } from "./MessageInput.js";

const unmounts: Array<() => void> = [];
afterEach(() => {
  flushFrame();
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
});

function setup() {
  const html = state("");
  const sent: string[] = [];
  const c = document.createElement("div");
  document.body.appendChild(c);
  unmounts.push(
    mount(c, () => (
      <MessageInput
        html={html}
        onSend={() => sent.push(html.sample())}
        placeholder="Message"
      />
    )),
  );
  const el = c.querySelector<HTMLElement>("[contenteditable]")!;
  const typeInto = (text: string) => {
    el.innerHTML = text;
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };
  return { html, sent, el, typeInto, c };
}

describe("MessageInput", () => {
  test("typing updates the state; the state does not write back what is already there", () => {
    const { html, el, typeInto } = setup();
    let writes = 0;
    const desc = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "innerHTML",
    )!;
    Object.defineProperty(el, "innerHTML", {
      set(v: string) {
        writes++;
        desc.set!.call(this, v);
      },
      get() {
        return desc.get!.call(this);
      },
      configurable: true,
    });
    typeInto("hel");
    typeInto("hello");
    flushFrame();
    expect(html.sample()).toBe("hello");
    expect(writes).toBe(2); // our two typeInto writes only — no echo from the state
  });

  test("an external write (draft, clear-after-send) lands", () => {
    const { html, el } = setup();
    html.set("draft text");
    flushFrame();
    expect(el.innerHTML).toBe("draft text");
    html.set("");
    flushFrame();
    expect(el.innerHTML).toBe("");
  });

  test("no external write during an IME composition; applied when it ends", () => {
    const { html, el, typeInto } = setup();
    el.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    typeInto("に");
    html.set("replaced"); // e.g. a draft arriving mid-composition
    flushFrame();
    expect(el.innerHTML).toBe("に"); // untouched
    el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    typeInto("にほ"); // composition commits → input event
    flushFrame();
    expect(html.sample()).toBe("にほ"); // the user's text wins over the stale external write
  });

  test("Enter sends, Shift+Enter does not; the placeholder follows emptiness", () => {
    const { sent, el, typeInto, c } = setup();
    const placeholder = c.querySelector(".placeholder-text")!;
    expect(placeholder.classList.contains("hidden")).toBe(false);
    typeInto("hi");
    flushFrame();
    expect(placeholder.classList.contains("hidden")).toBe(true);
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(sent).toEqual([]);
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(sent).toEqual(["hi"]);
  });
});
