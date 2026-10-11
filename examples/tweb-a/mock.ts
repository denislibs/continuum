// A stand-in for the MTProto layer: a stream of updates (new messages,
// edits, reactions) arriving as separate tasks — the shape that makes the
// frame pass earn its keep — and a paginated history fetch.

import { stream, type Stream } from "@continuum-js/frp";

export type Message = {
  id: number;
  chatId: number;
  from: string;
  text: string;
  reactions: number;
  edited: boolean;
};

export type Update =
  | { type: "new"; message: Message }
  | { type: "edit"; chatId: number; id: number; text: string }
  | { type: "react"; chatId: number; id: number; delta: number };

export interface Api {
  /** Live updates, each one its own moment. */
  updates: Stream<Update>;
  /** Up to `limit` messages of `chatId` with ids below `beforeId`, oldest first. */
  history(chatId: number, beforeId: number, limit: number): Promise<Message[]>;
  /** The most recent messages of every chat — what a client has at startup. */
  initial(): Record<number, Message[]>;
  /** Feed one update by hand (tests). */
  push(u: Update): void;
  /** Start/stop the random update generator (demo). */
  start(intervalMs: number): void;
  stop(): void;
}

export const CHATS = [1, 2, 3];
const AUTHORS = ["ann", "bob", "cleo", "dan"];
const INITIAL = 50; // per chat
const FIRST_ID = 1000; // ids grow from here; history reaches below

function message(chatId: number, id: number): Message {
  return {
    id,
    chatId,
    from: AUTHORS[(id + chatId) % AUTHORS.length],
    text: `message ${id} in chat ${chatId}`,
    reactions: 0,
    edited: false,
  };
}

export function createMockApi(): Api {
  const updates = stream<Update>();
  let nextId = FIRST_ID + INITIAL;
  let timer: ReturnType<typeof setInterval> | undefined;

  const initial = (): Record<number, Message[]> => {
    const out: Record<number, Message[]> = {};
    for (const c of CHATS) {
      out[c] = Array.from({ length: INITIAL }, (_, i) =>
        message(c, FIRST_ID + i),
      );
    }
    return out;
  };

  const history = (chatId: number, beforeId: number, limit: number) => {
    const ids: number[] = [];
    for (let id = beforeId - 1; id > beforeId - 1 - limit && id > 0; id--)
      ids.unshift(id);
    return Promise.resolve(ids.map((id) => message(chatId, id)));
  };

  const random = (): Update => {
    const chatId = CHATS[Math.floor(Math.random() * CHATS.length)];
    const r = Math.random();
    const recent = nextId - 1 - Math.floor(Math.random() * 20);
    if (r < 0.4) return { type: "new", message: message(chatId, nextId++) };
    if (r < 0.7)
      return { type: "edit", chatId, id: recent, text: `edited ${recent}` };
    return { type: "react", chatId, id: recent, delta: 1 };
  };

  return {
    updates,
    history,
    initial,
    push: (u) => updates.fire(u),
    start(ms) {
      this.stop();
      timer = setInterval(() => updates.fire(random()), ms);
    },
    stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    },
  };
}
