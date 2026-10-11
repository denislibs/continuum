import { state } from "@continuum-js/frp";
import { Each } from "@continuum-js/dom";
import { beginHeavyAnimation } from "@continuum-js/dom/layout";
import { CHATS, type Api } from "./mock.js";
import { createStore } from "./store.js";
import { MessageList } from "./message-list.js";

export const SWITCH_ANIMATION_MS = 200;

export function App(props: { api: Api }): Node {
  const store = createStore(props.api.initial(), props.api.updates);
  const current = state(CHATS[0]);
  const chats = state(CHATS);

  const open = (id: number) => {
    if (id === current.sample()) return;
    // the pane fades for 200 ms: hold the list still meanwhile
    beginHeavyAnimation(SWITCH_ANIMATION_MS);
    current.set(id);
  };

  return (
    <div class="app">
      <nav class="chats">
        <Each each={chats} by={(id: number) => id}>
          {(id: number) => (
            <button
              class={current.map((c) => (c === id ? "active" : ""))}
              onClick={() => open(id)}
            >
              chat {id}
            </button>
          )}
        </Each>
      </nav>
      <div class="pane">
        <MessageList chat={current} store={store} api={props.api} />
      </div>
    </div>
  );
}
