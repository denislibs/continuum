/** @jsxImportSource @continuum-js/dom */
// Б7 — enumerated attributes: `false` is a value, not an absence.
import { describe, test, expect } from "vitest";
import { state, flushFrame } from "@continuum-js/frp";

describe("enumerated attributes", () => {
  test("draggable/spellcheck/contenteditable/translate={false} render their false token", () => {
    const el = (
      <div
        draggable={false}
        spellcheck={false}
        contenteditable={false}
        translate={false}
      />
    ) as HTMLElement;
    expect(el.getAttribute("draggable")).toBe("false");
    expect(el.getAttribute("spellcheck")).toBe("false");
    expect(el.getAttribute("contenteditable")).toBe("false");
    expect(el.getAttribute("translate")).toBe("no");
  });

  test("true renders the positive token; a bound state toggles between them", () => {
    const on = state(true);
    const el = (<div draggable={on} spellcheck={on} />) as HTMLElement;
    expect(el.getAttribute("draggable")).toBe("true");
    expect(el.getAttribute("spellcheck")).toBe("true");
    on.set(false);
    flushFrame();
    expect(el.getAttribute("draggable")).toBe("false");
    expect(el.getAttribute("spellcheck")).toBe("false");
  });

  test("ordinary boolean attributes are unchanged: false removes them", () => {
    const el = (<input disabled={false} required={true} />) as HTMLElement;
    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.getAttribute("required")).toBe("");
  });
});
