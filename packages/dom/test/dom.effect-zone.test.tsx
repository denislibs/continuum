/** @jsxImportSource @continuum-js/dom */
// Law 3 in the renderer: onMount is an effect zone (always — first mount
// and region rebuilds alike); the renderer's own layout-forcing call
// (focus restore in `each`) runs outside the zone; delegated events do not
// leave `currentTarget` pinned on the event object.
import { describe, test, expect, afterEach } from "vitest";
import { state, flushFrame, inEffectZone } from "@continuum-js/frp";
import { mount, onMount, Show, each } from "@continuum-js/dom";

const unmounts: Array<() => void> = [];
afterEach(() => {
  flushFrame();
  for (const u of unmounts.splice(0)) u();
  document.body.innerHTML = "";
});
function mountInBody(view: () => Node): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  unmounts.push(mount(c, view));
  return c;
}

describe("effect zone in the renderer", () => {
  test("onMount runs in the effect zone on the first mount", () => {
    let zone: boolean | null = null;
    mountInBody(() => {
      onMount(() => (zone = inEffectZone()));
      return <i />;
    });
    expect(zone).toBe(true);
    expect(inEffectZone()).toBe(false); // left after the flush
  });

  test("onMount runs in the effect zone on a region rebuild", () => {
    const show = state(false);
    let zone: boolean | null = null;
    mountInBody(() => (
      <Show when={show}>
        {() => {
          onMount(() => (zone = inEffectZone()));
          return <i />;
        }}
      </Show>
    ));
    show.set(true);
    flushFrame();
    expect(zone).toBe(true);
  });

  test("the component body itself is not the effect zone", () => {
    let zone: boolean | null = null;
    mountInBody(() => {
      zone = inEffectZone();
      return <i />;
    });
    expect(zone).toBe(false);
  });

  test("each's focus restore after a move does not count as an effect-zone read", () => {
    // focus() forces layout; the renderer wraps its own call in withLayout.
    // Observable contract: focus is restored, and the zone flag is intact.
    const items = state([1, 2]);
    const c = mountInBody(() => (
      <ul>
        {each(
          items,
          (i) => i,
          (i) => (
            <li>
              <input id={`in${i}`} />
            </li>
          ),
        )}
      </ul>
    ));
    const in2 = c.querySelector<HTMLInputElement>("#in2")!;
    in2.focus();
    expect(document.activeElement).toBe(in2);
    items.set([2, 1]); // moves the focused row
    flushFrame();
    expect(document.activeElement).toBe(in2);
    expect(inEffectZone()).toBe(false);
  });
});

describe("delegated events", () => {
  test("currentTarget is the handler's element during dispatch and not pinned afterwards", () => {
    let during: EventTarget | null = null;
    let ev: Event | null = null;
    const c = mountInBody(() => (
      <div
        onClick={(e) => {
          during = e.currentTarget;
          ev = e;
        }}
      >
        <span>x</span>
      </div>
    ));
    const span = c.querySelector("span")!;
    span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(during).toBe(c.firstElementChild);
    // after dispatch the native getter is back: no own property pins a node
    expect(
      Object.getOwnPropertyDescriptor(ev!, "currentTarget"),
    ).toBeUndefined();
    expect(ev!.currentTarget).toBeNull();
  });
});
