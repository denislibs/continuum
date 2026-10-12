// The normalized store: one fold over the update stream. Messages per chat,
// oldest first. An edit or a reaction replaces the message object, so a
// row's State<Message> (the second `each` argument) sees a new value.

import {
  type Stream,
  type State,
  type StateSource,
  state,
} from "@continuum-js/frp";
import type { Message, Update } from "./mock.js";

export type Chats = Record<number, Message[]>;

export interface Store {
  chats: State<Chats>;
  /** Older messages fetched from history; merged in front, deduplicated. */
  prepend(chatId: number, older: Message[]): void;
}

function insertSorted(list: Message[], m: Message): Message[] {
  if (list.length === 0 || list[list.length - 1].id < m.id) return [...list, m];
  const out = list.slice();
  let i = out.length;
  while (i > 0 && out[i - 1].id > m.id) i--;
  if (out[i - 1]?.id === m.id) out[i - 1] = m;
  else out.splice(i, 0, m);
  return out;
}

function patch(
  list: Message[],
  id: number,
  f: (m: Message) => Message,
): Message[] {
  const i = list.findIndex((m) => m.id === id);
  if (i < 0) return list;
  const out = list.slice();
  out[i] = f(out[i]);
  return out;
}

export function reduce(chats: Chats, u: Update): Chats {
  const list = chats[u.type === "new" ? u.message.chatId : u.chatId] ?? [];
  switch (u.type) {
    case "new":
      return { ...chats, [u.message.chatId]: insertSorted(list, u.message) };
    case "edit":
      return {
        ...chats,
        [u.chatId]: patch(list, u.id, (m) => ({
          ...m,
          text: u.text,
          edited: true,
        })),
      };
    case "react":
      return {
        ...chats,
        [u.chatId]: patch(list, u.id, (m) => ({
          ...m,
          reactions: m.reactions + u.delta,
        })),
      };
  }
}

/** Build the store: a source cell driven by updates (`.on`) and by history loads. */
export function createStore(initial: Chats, updates: Stream<Update>): Store {
  const chats: StateSource<Chats> = state(initial).on(updates, reduce);
  return {
    chats,
    prepend(chatId, older) {
      chats.update((c) => {
        const have = new Set((c[chatId] ?? []).map((m) => m.id));
        const fresh = older.filter((m) => !have.has(m.id));
        if (fresh.length === 0) return c;
        return { ...c, [chatId]: [...fresh, ...(c[chatId] ?? [])] };
      });
    },
  };
}
