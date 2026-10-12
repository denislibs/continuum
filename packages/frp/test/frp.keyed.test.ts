// keyed(dict): one process over a State<Record|Map> hands out per-key
// cells; a dict update wakes only the cells whose value changed. The
// fine-grained answer to "N rows selecting from one global store".
import { describe, test, expect, afterEach } from "vitest";
import {
  state,
  root,
  batch,
  flushFrame,
  keyed,
  Stream,
} from "@continuum-js/frp";

type Chat = { id: number; title: string; unread: number };
const chat = (id: number, unread = 0): Chat => ({
  id,
  title: `chat ${id}`,
  unread,
});

const edgeCount = (e: Stream<unknown>): number => {
  const n = e as unknown as { ob0: unknown; obs: unknown[] | null };
  return (n.ob0 ? 1 : 0) + (n.obs?.length ?? 0);
};

afterEach(() => flushFrame());

describe("keyed over a Record", () => {
  test("a cell samples the value under its key, undefined when absent", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1), 2: chat(2) });
      const cell = keyed(byId);
      expect(cell(1).sample()).toEqual(chat(1));
      expect(cell(3).sample()).toBeUndefined();
    });
  });

  test("a dict update delivers to the changed key only", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1), 2: chat(2) });
      const cell = keyed(byId);
      const seen1: Chat[] = [];
      const seen2: Chat[] = [];
      cell(1).updates.listen((c) => seen1.push(c!));
      cell(2).updates.listen((c) => seen2.push(c!));
      byId.update((d) => ({ ...d, 1: chat(1, 5) })); // chat 2 keeps its object
      flushFrame();
      expect(seen1).toEqual([chat(1, 5)]);
      expect(seen2).toEqual([]);
    });
  });

  test("the same key hands out the same cell while it is listened", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId);
      const a = cell(1);
      const un = a.updates.listen(() => {});
      expect(cell(1)).toBe(a);
      un();
    });
  });

  test("removal delivers undefined; re-adding delivers the new value", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId);
      const seen: Array<Chat | undefined> = [];
      cell(1).updates.listen((c) => seen.push(c));
      byId.set({});
      flushFrame();
      byId.set({ 1: chat(1, 9) });
      flushFrame();
      expect(seen).toEqual([undefined, chat(1, 9)]);
    });
  });

  test("push agrees with pull inside the same frame", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId);
      const c = cell(1);
      c.updates.listen((v) => expect(v).toBe(c.sample()));
      byId.set({ 1: chat(1, 2) });
      flushFrame();
    });
  });

  test("a custom equality decides what counts as a change", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId, (a, b) => a?.unread === b?.unread);
      const seen: Chat[] = [];
      cell(1).updates.listen((c) => seen.push(c!));
      byId.set({ 1: { ...chat(1), title: "renamed" } }); // same unread → no change
      byId.set({ 1: chat(1, 1) });
      flushFrame();
      expect(seen).toEqual([chat(1, 1)]);
    });
  });

  test("cells are evicted when their last listener leaves and reseed on re-request", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId);
      const a = cell(1);
      const un = a.updates.listen(() => {});
      un();
      byId.set({ 1: chat(1, 7) }); // changes while nobody holds the cell
      const b = cell(1);
      expect(b).not.toBe(a); // a fresh cell …
      expect(b.sample()).toEqual(chat(1, 7)); // … seeded from the current dict
    });
  });

  test("ONE edge on the dict regardless of how many cells are live", () => {
    root(() => {
      const byId = state<Record<number, Chat>>(
        Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [i, chat(i)]),
        ),
      );
      const cell = keyed(byId);
      for (let i = 0; i < 1000; i++) cell(i).updates.listen(() => {});
      expect(edgeCount(byId.updates)).toBe(1);
    });
  });

  test("updates inside a batch coalesce per cell", () => {
    root(() => {
      const byId = state<Record<number, Chat>>({ 1: chat(1) });
      const cell = keyed(byId);
      const seen: Chat[] = [];
      cell(1).updates.listen((c) => seen.push(c!));
      batch(() => {
        byId.set({ 1: chat(1, 1) });
        byId.set({ 1: chat(1, 2) });
      });
      flushFrame();
      expect(seen).toEqual([chat(1, 2)]);
    });
  });

  test("the process belongs to the ambient scope", () => {
    const byId = state<Record<number, Chat>>({ 1: chat(1) });
    expect(() => keyed(byId)).toThrow(/scope|root\(\)/);
  });
});

describe("keyed over a Map", () => {
  test("works the same with Map keys", () => {
    root(() => {
      const byId = state(new Map<string, Chat>([["a", chat(1)]]));
      const cell = keyed(byId);
      const seen: Array<Chat | undefined> = [];
      cell("a").updates.listen((c) => seen.push(c));
      expect(cell("a").sample()).toEqual(chat(1));
      byId.set(new Map([["a", chat(1, 3)]]));
      flushFrame();
      expect(seen).toEqual([chat(1, 3)]);
    });
  });
});
