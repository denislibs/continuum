// The hard part of a chat client, on the whole stack:
//  - a window over the chat (the last N messages), grown when the user
//    scrolls near the top; history fetched when the store runs out;
//  - scroll anchoring on prepend, through `measure` (reads after this
//    frame's writes, before paint — no visible jump);
//  - rows with live data: `(m, row)` — an edit patches a text node;
//  - `holdWhile`: the list stands still while a chat transition animates.

import { state, combine, perform, type State } from "@continuum-js/frp";
import { each, onCleanup } from "@continuum-js/dom";
import {
  createScroll,
  measure,
  isHeavyAnimating,
} from "@continuum-js/dom/layout";
import { holdWhile } from "@continuum-js/std";
import type { Api, Message } from "./mock.js";
import type { Store } from "./store.js";

const PAGE = 30;
const TOP_THRESHOLD = 40; // px from the top that counts as "reached the top"

export function MessageList(props: {
  chat: State<number>;
  store: Store;
  api: Api;
}): HTMLElement {
  const list = (<div class="messages" />) as HTMLElement;

  // --- the window ---------------------------------------------------------
  const limit = state(PAGE);
  const all = combine(
    props.chat,
    props.store.chats,
    (id, chats) => chats[id] ?? [],
  );
  const visible = combine(all, limit, (ms, n) =>
    ms.slice(Math.max(0, ms.length - n)),
  );
  // a chat switch resets the window
  onCleanup(props.chat.updates.listen(() => limit.set(PAGE)));

  // --- load older, with scroll anchoring --------------------------------
  // The rule the frame pass imposes: a read that must happen BEFORE a write
  // cannot live in an effect that also performs the write (effects run after
  // the round's writes). So the write is a consequence of the measurement:
  // measure first, then grow/prepend in the result's listener; the "after"
  // measure then runs past those writes, still before paint.
  const scroll = createScroll(list);
  const reachedTop = scroll.updates
    .map((p) => p.top < TOP_THRESHOLD)
    .filter((near) => near);
  const snapshot = () => ({ height: list.scrollHeight, top: list.scrollTop });
  const anchor = state<{ height: number; top: number } | null>(null);

  // 1. reached the top → remember the position, then grow the window
  onCleanup(
    measure(reachedTop, snapshot).listen((a) => {
      anchor.set(a);
      limit.update((n) => n + PAGE);
    }),
  );
  // 2. the window outgrew the store → fetch older history
  const needFetch = limit.updates.filter((n) => all.sample().length <= n);
  const fetched = perform(needFetch, () => {
    const id = props.chat.sample();
    const oldest = all.sample()[0]?.id ?? Number.MAX_SAFE_INTEGER;
    return props.api
      .history(id, oldest, PAGE)
      .then((older) => ({ chatId: id, older }));
  });
  // 3. history arrived → remember the position, then prepend
  onCleanup(
    measure(fetched, (r) => ({ r, a: snapshot() })).listen(({ r, a }) => {
      if (!r.ok) return;
      anchor.set(a);
      props.store.prepend(r.value.chatId, r.value.older);
    }),
  );
  // 4. the list changed → restore the content position
  const held = holdWhile(visible, isHeavyAnimating);
  onCleanup(
    measure(held.updates, () => list.scrollHeight).listen((height) => {
      const a = anchor.sample();
      if (!a) return;
      anchor.set(null);
      list.scrollTop = a.top + (height - a.height); // a write — fine in an effect
    }),
  );

  // --- rows ---------------------------------------------------------------
  list.appendChild(
    each(
      held,
      (m: Message) => m.id,
      (m, row) => (
        <div class="msg" data-id={String(m.id)}>
          <b>{m.from}</b> <span class="text">{row.map((x) => x.text)}</span>
          <span class="rx">
            {row.map((x) => (x.reactions ? `+${x.reactions}` : ""))}
          </span>
        </div>
      ),
    ),
  );
  list.classList.toggle("animating", isHeavyAnimating.sample());
  onCleanup(
    isHeavyAnimating.listen((on) => list.classList.toggle("animating", on)),
  );
  return list;
}
