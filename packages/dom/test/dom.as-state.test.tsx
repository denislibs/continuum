/** @jsxImportSource @continuum-js/dom */
// asState: the one helper a reusable component needs to accept
// `Reactive<T>` props (a plain value or a State) uniformly.
import { describe, test, expect } from "vitest";
import { state, State, flushFrame } from "@continuum-js/frp";
import { asState, type Reactive } from "@continuum-js/dom";

describe("asState", () => {
  test("wraps a plain value in a constant State", () => {
    const s = asState("x");
    expect(s).toBeInstanceOf(State);
    expect(s.sample()).toBe("x");
  });

  test("returns a State as-is", () => {
    const s = state(1);
    expect(asState(s)).toBe(s);
  });

  test("undefined is a value too (an optional prop left out)", () => {
    const s = asState<string | undefined>(undefined);
    expect(s.sample()).toBeUndefined();
  });

  test("lets a component bind a Reactive prop either way", () => {
    function Badge(props: { label: Reactive<string> }) {
      return <b>{asState(props.label).map((l) => l.toUpperCase())}</b>;
    }
    const live = state("a");
    const el = (
      <div>
        <Badge label="static" />
        <Badge label={live} />
      </div>
    ) as HTMLElement;
    expect(el.textContent).toBe("STATICA");
    live.set("b");
    flushFrame();
    expect(el.textContent).toBe("STATICB");
  });
});
