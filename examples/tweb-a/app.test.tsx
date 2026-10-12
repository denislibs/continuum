/** @jsxImportSource @continuum-js/dom */
// The spike's acceptance: edits patch rows in place, a burst of updates is
// one reconcile, loading older keeps the scroll anchored, a chat switch
// holds the list still while the transition animates.
import { test, expect, afterEach, vi } from "vitest";
import { render, cleanup, click, flush } from "@continuum-js/test";
import { flushFrame } from "@continuum-js/frp";
import { App, SWITCH_ANIMATION_MS } from "./app.js";
import { createMockApi } from "./mock.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const rows = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>(".msg"));
const ids = (c: HTMLElement) => rows(c).map((r) => Number(r.dataset.id));

test("an edit and a reaction patch the row in place — no rebuild", () => {
  const api = createMockApi();
  const { container } = render(() => <App api={api} />);
  const before = rows(container);
  expect(before).toHaveLength(30); // the window
  const last = before[before.length - 1];
  const id = Number(last.dataset.id);

  api.push({ type: "edit", chatId: 1, id, text: "hello, edited" });
  api.push({ type: "react", chatId: 1, id, delta: 2 });
  flushFrame();

  expect(last.querySelector(".text")!.textContent).toBe("hello, edited");
  expect(last.querySelector(".rx")!.textContent).toBe("+2");
  expect(rows(container)[29]).toBe(last); // the same element
});

test("a burst of 50 new messages between frames is one window update", () => {
  const api = createMockApi();
  const { container } = render(() => <App api={api} />);
  const firstRowBefore = rows(container)[0];
  for (let i = 0; i < 50; i++) {
    api.push({
      type: "new",
      message: {
        id: 2000 + i,
        chatId: 1,
        from: "zed",
        text: `burst ${i}`,
        reactions: 0,
        edited: false,
      },
    });
  }
  expect(rows(container)[0]).toBe(firstRowBefore); // nothing touched the DOM yet
  flushFrame();
  const after = ids(container);
  expect(after).toHaveLength(30);
  expect(after[after.length - 1]).toBe(2049); // the newest
  expect(after[0]).toBe(2020); // the window slid in ONE step
});

test("loading older keeps the viewport anchored to the same message", async () => {
  const api = createMockApi();
  const { container } = render(() => <App api={api} />);
  const list = container.querySelector<HTMLElement>(".messages")!;
  // jsdom has no layout: model a 20 px row height
  Object.defineProperty(list, "scrollHeight", {
    get: () => rows(container).length * 20,
    configurable: true,
  });
  expect(ids(container)[0]).toBe(1020); // 50 in the store, window of 30

  list.scrollTop = 10; // near the top
  list.dispatchEvent(new Event("scroll"));
  flushFrame();
  // the window grew into the store's 50 and a history fetch was issued
  await flush();
  flushFrame();

  const after = ids(container);
  expect(after[0]).toBeLessThan(1000); // history arrived
  expect(after).toHaveLength(60);
  // 30 rows prepended at 20 px each: the viewport must have moved by 600
  expect(list.scrollTop).toBe(10 + 30 * 20);
});

test("a chat switch holds the list still during the transition, then catches up", () => {
  vi.useFakeTimers();
  const api = createMockApi();
  const { container } = render(() => <App api={api} />);
  expect(rows(container)[0].textContent).toContain("chat 1");

  const buttons = container.querySelectorAll("button");
  click(buttons[1]); // chat 2 — begins the heavy animation
  expect(rows(container)[0].textContent).toContain("chat 1"); // held
  expect(
    container.querySelector(".messages")!.classList.contains("animating"),
  ).toBe(true);

  vi.advanceTimersByTime(SWITCH_ANIMATION_MS);
  flushFrame();
  expect(rows(container)[0].textContent).toContain("chat 2"); // released
  expect(
    container.querySelector(".messages")!.classList.contains("animating"),
  ).toBe(false);
});
