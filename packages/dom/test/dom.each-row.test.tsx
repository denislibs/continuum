/** @jsxImportSource @continuum-js/dom */
// Rows with live data: `render(item, row)` — `row` is a State<T> that
// follows the item under the same key, so a row built once still shows
// edits (a message edited, a reaction added) without a rebuild.
import { describe, test, expect, afterEach } from "vitest";
import { state, flushFrame, type State } from "@continuum-js/frp";
import { mount, each, Each } from "@continuum-js/dom";

type Msg = { id: number; text: string };

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

describe("each(items, key, (item, row))", () => {
  test("a reused row's text follows the new item under the same key", () => {
    const items = state<Msg[]>([{ id: 1, text: "A" }]);
    let builds = 0;
    const c = mountInBody(() => (
      <ul>
        {each(
          items,
          (m) => m.id,
          (_m, row) => {
            builds++;
            return <li>{row.map((m) => m.text)}</li>;
          },
        )}
      </ul>
    ));
    expect(c.textContent).toBe("A");
    items.set([{ id: 1, text: "B" }]); // same key, new data
    flushFrame();
    expect(c.textContent).toBe("B");
    expect(builds).toBe(1); // no rebuild
  });

  test("row.sample() is the current item; the initial item is the first value", () => {
    const items = state<Msg[]>([{ id: 1, text: "A" }]);
    let row!: State<Msg>;
    mountInBody(() => (
      <ul>
        {each(
          items,
          (m) => m.id,
          (m, r) => {
            row = r;
            expect(r.sample()).toBe(m);
            return <li />;
          },
        )}
      </ul>
    ));
    const next = { id: 1, text: "B" };
    items.set([next]);
    flushFrame();
    expect(row.sample()).toBe(next);
  });

  test("an identical item (Object.is) does not emit on the row", () => {
    const a = { id: 1, text: "A" };
    const items = state<Msg[]>([a]);
    const seen: Msg[] = [];
    mountInBody(() => (
      <ul>
        {each(
          items,
          (m) => m.id,
          (_m, row) => {
            row.updates.listen((v) => seen.push(v));
            return <li />;
          },
        )}
      </ul>
    ));
    items.set([a, { id: 2, text: "C" }]); // row 1 reused with the same object
    flushFrame();
    expect(seen).toEqual([]);
  });

  test("a render that ignores the second argument costs no row cell", () => {
    // Observable via the call shape: a one-parameter render (a rest
    // parameter does not count) is called with the item alone — no State is
    // allocated per row.
    const items = state<Msg[]>([{ id: 1, text: "A" }]);
    let extra = -1;
    mountInBody(() => (
      <ul>
        {each(
          items,
          (m) => m.id,
          (m: Msg, ...rest: unknown[]) => {
            extra = rest.length;
            return <li>{m.text}</li>;
          },
        )}
      </ul>
    ));
    expect(extra).toBe(0);
  });

  test("a row that left the list stops following", () => {
    const items = state<Msg[]>([{ id: 1, text: "A" }]);
    let row!: State<Msg>;
    mountInBody(() => (
      <ul>
        {each(
          items,
          (m) => m.id,
          (_m, r) => {
            row ??= r; // keep the FIRST row's state
            return <li />;
          },
        )}
      </ul>
    ));
    items.set([]);
    flushFrame();
    items.set([{ id: 1, text: "fresh" }]); // a NEW row (new cell), not the old one
    flushFrame();
    expect(row.sample().text).toBe("A");
  });
});

describe("<Each>", () => {
  test("passes the row state as the second children argument", () => {
    const items = state<Msg[]>([{ id: 1, text: "A" }]);
    const c = mountInBody(() => (
      <ul>
        <Each each={items} by={(m: Msg) => m.id}>
          {(_m: Msg, row: State<Msg>) => <li>{row.map((m) => m.text)}</li>}
        </Each>
      </ul>
    ));
    items.set([{ id: 1, text: "B" }]);
    flushFrame();
    expect(c.textContent).toBe("B");
  });
});
