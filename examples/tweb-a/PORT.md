# Telegram Web A на Continuum — план порта с кодом

Один к одному с `telegram-tt` (Ajaxy): та же структура, те же компоненты и классы, тот же стор — только без teact, хуков и `withGlobal`. Ниже — скелет каждого слоя в коде. Это не полная реализация, а образец «как пишется каждая вещь», достаточный, чтобы дальше портировать механически.

## 0. Карта соответствий

| telegram-tt                                                           | Continuum                                                                                                                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `global` (один объект), `setGlobal`/`getGlobal`                       | слайсы `chats`/`users`/`messages`/`ui: State<…>` — по `accum` над одним `actions`; эфемерное (typing, online) — ячейки мимо свёртки |
| `addActionHandler("openChat", (global, actions, payload) => …)`       | ветка в `reduceX(slice, action)` каждого задетого слайса; эффекты — `perform` на `actions.filter(…)`                                |
| `withGlobal(mapStateToProps)(Component)`                              | `keyed`-ячейки для `byId`, `select(slice, sel)` для одиночных значений, в props как `State<T>`                                      |
| `apiUpdate` → `addActionHandler("apiUpdate")`                         | `apiUpdates: Stream<ApiUpdate>` из воркера → тот же `reduce`                                                                        |
| `callApi("fetchMessages", …)`                                         | `perform(requests, (r) => callApi(…))`                                                                                              |
| `useState`/`useRef`/`useMemo`/`useCallback`                           | `state()`, обычная переменная, `map`/`combine`, обычная функция                                                                     |
| `useEffect(fn, deps)`                                                 | `combine(deps…).listen(fn)` + `onCleanup`                                                                                           |
| `useLayoutEffect` + `requestMeasure`/`requestMutation`/`forceMeasure` | `measure(trigger, read)` / запись в `listen` / `forceMeasure`                                                                       |
| `beginHeavyAnimation`, `useHeavyAnimation`                            | `beginHeavyAnimation`, `isHeavyAnimating`, `holdWhile`                                                                              |
| `teactFastList` / `teactOrderKey`                                     | `each` (LIS)                                                                                                                        |
| `memo`                                                                | не нужен                                                                                                                            |
| `<Transition name="slide" activeKey>`                                 | `Transition` над `dyn` + CSS, гейт через heavy animation                                                                            |
| `useInfiniteScroll`, `InfiniteScroll`                                 | `createScroll` + окно `combine(ids, viewport)`                                                                                      |
| `useIntersectionObserver`                                             | `createVisibility`                                                                                                                  |
| `useFlag`, `useLastCallback`, `useStateRef`                           | не нужны (нет ререндеров и stale closures)                                                                                          |

## 1. Структура

```
src/
  api/            gramjs в воркере — без изменений (это не UI)
  global/
    types.ts      GlobalState — без изменений
    actions.ts    stream<Action>() + типизированный dispatch
    reducers/     чистые (slice, action) => slice — по доменам, как в tt
    selectors/    чистые (slice, …) => T — переносятся как есть
    effects/      perform-цепочки (бывшие async action handlers)
    ephemeral.ts  ячейки для typing/online/progress — мимо свёртки
    index.ts      слайсы = events.accum(…); keyed над byId
  components/
    left/  middle/  right/  common/  ui/  modals/
  hooks/ → lib/   composables: createX (scope-зависимые), чистые хелперы
  styles/         scss без изменений
```

## 2. Стор: слайсы + ячейки (B + C)

tt держит один `global`, потому что у teactn один `setGlobal`. У нас стор делится на два вида состояния с разной природой:

- **История** (чаты, пользователи, сообщения, настройки, навигация) — свёртка над потоком действий. Это всё, ради чего модель: транзакции, undo/replay, persist одной строкой. Режется на **слайсы по доменам**: каждый — своя `accum` над **одним и тем же** потоком `actions`. Все слайсы сворачивают один момент, поэтому `openChat`, который трогает `chats` + `messages` + `ui`, остаётся атомарным без усилий — `combine` слайсов по закону не увидит полумомента. Копируется только свой слайс, не корень.
- **Эфемерное** (typing, online, «печатает…», просмотры, прогресс загрузки) — не история, replay не нужен, частота самая высокая. Это **ячейки**, в которые апдейт из воркера пишет напрямую: O(1), ноль копий, мимо свёртки.

```ts
// global/actions.ts
import { stream } from "@continuum-js/frp";
import type { ActionPayloads } from "./types";

export type Action = {
  [K in keyof ActionPayloads]: { type: K; payload: ActionPayloads[K] };
}[keyof ActionPayloads];

export const actions = stream<Action>();

// то же, что getActions().openChat({ id }) в tt
export const dispatch = new Proxy({} as Actions, {
  get: (_, type: string) => (payload: unknown) =>
    actions.fire({ type, payload } as Action),
});
```

```ts
// global/index.ts — слайсы над одним потоком
import { root, keyed, selector, combine } from "@continuum-js/frp";
import { actions } from "./actions";
import { apiUpdates } from "../api/bridge";
import { reduceChats, reduceUsers, reduceMessages, reduceUi } from "./reducers";

// apiUpdate в tt — тоже action; воркер шлёт пачку в batch() → один момент
const events = actions.or(
  apiUpdates.map((u) => ({ type: "apiUpdate", payload: u }) as Action),
);

export const chats = root(() =>
  events.accum(INITIAL.chats, (a, s) => reduceChats(s, a)),
);
export const users = root(() =>
  events.accum(INITIAL.users, (a, s) => reduceUsers(s, a)),
);
export const messages = root(() =>
  events.accum(INITIAL.messages, (a, s) => reduceMessages(s, a)),
);
export const ui = root(() =>
  events.accum(INITIAL.ui, (a, s) => reduceUi(s, a)),
);

// byId-словари → keyed(): ячейка на ключ, обновляются только изменившиеся ключи
export const chatById = root(() => keyed(chats.map((c) => c.byId)));
export const userById = root(() => keyed(users.map((u) => u.byId)));
export const messagesByChat = root(() =>
  keyed(messages.map((m) => m.byChatId)),
);
// «этот чат открыт?» → selector(): O(2) при смене
export const isChatOpen = root(() =>
  selector(ui.map((u) => u.messageList?.chatId)),
);

// кросс-доменный селектор — combine слайсов, glitch-free
export const senderOf = (m: ApiMessage) =>
  m.senderId ? userById(m.senderId) : chatById(m.chatId);
```

```ts
// global/ephemeral.ts — ячейки мимо свёртки
import { state, type StateSource } from "@continuum-js/frp";
import { apiUpdates } from "../api/bridge";

function cells<K, V>(init: V) {
  const map = new Map<K, StateSource<V>>();
  return (key: K): StateSource<V> => {
    let c = map.get(key);
    if (!c) map.set(key, (c = state(init)));
    return c;
  };
}

export const typingOf = cells<string, ApiTypingStatus | undefined>(undefined);
export const onlineOf = cells<string, ApiUserStatus | undefined>(undefined);
export const uploadProgress = cells<string, number>(0);

root(() => {
  apiUpdates.listen((u) => {
    if (u["@type"] === "updateChatTypingStatus")
      typingOf(u.id).set(u.typingStatus);
    else if (u["@type"] === "updateUserStatus")
      onlineOf(u.userId).set(u.status);
  });
});
```

(В tt typing-статус живёт в `global.messages.byChatId[id].threadsById[t].typingStatus` и гоняет через весь reducer; здесь он не трогает ни один слайс.)

Reducers tt уже сгруппированы по доменам (`reducers/chats.ts`, `reducers/messages.ts`, …) — каждый становится `reduceX(slice, action)`:

```ts
// global/reducers/messages.ts — тот же код, только над своим слайсом
export function reduceMessages(s: MessagesState, a: Action): MessagesState {
  switch (a.type) {
    case "apiUpdate":
      return applyMessageUpdate(s, a.payload);
    case "addViewportMessages":
      return addViewportIds(
        addMessages(s, a.payload.chatId, a.payload.byId),
        a.payload,
      );
    default:
      return s;
  }
}
function addMessages(
  s: MessagesState,
  chatId: string,
  byId: Record<number, ApiMessage>,
): MessagesState {
  const current = s.byChatId[chatId] ?? { byId: {}, threadsById: {} };
  return {
    ...s,
    byChatId: {
      ...s.byChatId,
      [chatId]: { ...current, byId: { ...current.byId, ...byId } },
    },
  };
}
```

Действие, задевающее несколько доменов (`openChat` → `ui.messageList`, `chats.byId[id].unreadCount`, `messages` viewport), обрабатывается в каждом reducer по-своему — как `combineReducers` в Redux, но атомарно: один момент на все слайсы.

```ts
// global/effects/messages.ts — бывший async action handler loadViewportMessages
import { perform, batch } from "@continuum-js/frp";
import { actions, dispatch } from "../actions";
import { chats, messages } from "..";
import { callApi } from "../../api/bridge";

const loads = actions.filter((a) => a.type === "loadViewportMessages");

root(() => {
  const results = perform(loads, async (a) => {
    const { chatId, threadId, direction } = a.payload;
    const chat = chats.sample().byId[chatId];
    const offsetId = selectViewportEdge(
      messages.sample(),
      chatId,
      threadId,
      direction,
    );
    const result = await callApi("fetchMessages", {
      chat,
      offsetId,
      addOffset: -20,
      limit: 40,
    });
    return { chatId, threadId, direction, result };
  });
  results.listen((r) => {
    if (!r.ok) return;
    const { chatId, threadId, direction, result } = r.value;
    batch(() => {
      dispatch.addUsers(result.users);
      dispatch.addChats(result.chats);
      dispatch.addViewportMessages({
        chatId,
        threadId,
        direction,
        messages: result.messages,
      });
    });
  });
});
```

Селекторы tt остаются чистыми функциями; реактивность — на границе компонента:

```ts
// lib/select.ts
import { combine, type State } from "@continuum-js/frp";
import { dedupe } from "@continuum-js/std";
import { ui, chats } from "../global";

/** Одиночное значение из слайса, с дедупом по ссылке. */
export const select = <S, T>(
  slice: State<S>,
  sel: (s: S) => T,
  eq = Object.is,
) => dedupe(slice.map(sel), eq);

/** Селектор с параметром-State: без flatten, без пересоздания узла. */
export const selectWith = <S, P, T>(
  slice: State<S>,
  p: State<P>,
  sel: (s: S, p: P) => T,
  eq = Object.is,
) => dedupe(combine(slice, p, sel), eq);
```

Правило выбора: одиночные значения (текущий чат, флаги UI, тема) — `select(ui, …)`; всё «по id» — `chatById`/`userById`/`messagesByChat` (`keyed`); горячее эфемерное — ячейки. Так ни один момент стора не гоняет больше подписчиков, чем реально изменилось.

Undo/persist при слайсах: `persist("ui", ui)`, а снимок всего состояния для replay — `combine(chats, users, messages, ui, (c, u, m, i) => ({ c, u, m, i }))`.

## 3. Мост к воркеру

```ts
// api/bridge.ts
import { stream } from "@continuum-js/frp";
import type { ApiUpdate } from "./types";

const worker = new Worker(new URL("./gramjs/worker.ts", import.meta.url), {
  type: "module",
});
export const apiUpdates = stream<ApiUpdate>();

worker.onmessage = ({ data }) => {
  if (data.type === "updates") {
    // пачка апдейтов → один момент: joins пересчитываются один раз
    batch(() => data.updates.forEach((u: ApiUpdate) => apiUpdates.fire(u)));
  } else if (data.type === "result") {
    pending
      .get(data.id)
      ?.[data.error ? "reject" : "resolve"](data.error ?? data.result);
    pending.delete(data.id);
  }
};

const pending = new Map<
  number,
  { resolve: (v: unknown) => void; reject: (e: unknown) => void }
>();
let seq = 0;
export function callApi<K extends keyof ApiMethods>(
  name: K,
  ...args: Parameters<ApiMethods[K]>
) {
  const id = ++seq;
  worker.postMessage({ type: "call", id, name, args });
  return new Promise<ReturnType<ApiMethods[K]>>((resolve, reject) =>
    pending.set(id, { resolve, reject }),
  );
}
```

Запросы, которые не сворачиваются в action (`fetchChats` при скролле списка), — `perform` прямо в компоненте.

## 4. UI-примитивы (`components/ui`)

```tsx
// ui/Button.tsx
import { asState, type Reactive } from "@continuum-js/dom";

export function Button(props: {
  children?: Child;
  className?: Reactive<string>;
  color?: "primary" | "secondary" | "translucent" | "danger";
  size?: "default" | "smaller" | "tiny";
  round?: boolean;
  disabled?: Reactive<boolean>;
  ariaLabel?: string;
  onClick?: (e: MouseEvent) => void;
  ripple?: boolean;
}) {
  const cls = asState(props.className).map((c) =>
    buildClassName(
      "Button",
      props.color ?? "primary",
      props.size ?? "default",
      props.round && "round",
      c,
    ),
  );
  const el = (
    <button
      type="button"
      class={cls}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      {props.children}
      {props.ripple !== false && <RippleEffect />}
    </button>
  ) as HTMLButtonElement;
  return el;
}
```

`asState` — из `@continuum-js/dom`: `Reactive<T>` → `State<T>`.

```tsx
// ui/ListItem.tsx (ripple, контекстное меню, href)
export function ListItem(props: {
  className?: Reactive<string>;
  children: Child;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  href?: string;
  style?: Reactive<string>;
}) {
  const Tag = props.href ? "a" : "div";
  return (
    <div
      class={asState(props.className).map((c) => buildClassName("ListItem", c))}
      style={props.style}
    >
      <Tag
        class="ListItem-button"
        href={props.href}
        onClick={props.onClick}
        onContextMenu={props.onContextMenu}
      >
        {props.children}
        <RippleEffect />
      </Tag>
    </div>
  );
}
```

```tsx
// ui/Transition.tsx — slide/fade/zoom между activeKey, как в tt.
// Структура: оба слоя (старый и новый) живут в DOM на время анимации,
// затем старый уничтожается. Heavy-animation на период перехода.
export function Transition(props: {
  activeKey: State<number>;
  name: "slide" | "fade" | "zoom-fade" | "none";
  children: (key: number) => Child;
  className?: string;
}) {
  const container = (
    <div class={buildClassName("Transition", props.name, props.className)} />
  ) as HTMLElement;
  let prevLayer: HTMLElement | null = null;
  onCleanup(
    props.activeKey.listen((key) => {
      const layer = (
        <div class="Transition_slide Transition_slide-to">
          {props.children(key)}
        </div>
      ) as HTMLElement;
      const old = prevLayer;
      prevLayer = layer;
      if (!old) {
        layer.className = "Transition_slide Transition_slide-active";
        container.append(layer);
        return;
      }
      const end = beginHeavyAnimation(ANIMATION_DURATION + ANIMATION_END_DELAY);
      old.classList.replace("Transition_slide-active", "Transition_slide-from");
      container.append(layer);
      // класс-переключение на следующем кадре, чтобы transition сработал
      requestMeasure(() => {
        layer.classList.replace(
          "Transition_slide-to",
          "Transition_slide-active",
        );
      });
      old.addEventListener(
        "transitionend",
        () => {
          old.remove();
          end();
        },
        { once: true },
      );
    }),
  );
  return container;
}
```

(В реальном порте `children(key)` строится через `scope()` и dispose'ится вместе со слоем — как `shouldCleanup` в tt.)

```tsx
// ui/Modal.tsx — через Portal, с Esc и фокус-ловушкой
export function Modal(props: {
  isOpen: State<boolean>;
  title?: Child;
  onClose: () => void;
  children: Child;
}) {
  return (
    <Show when={props.isOpen}>
      {() => (
        <Portal mount={document.body}>
          <div
            class="Modal open shown"
            onKeydown={(e) => e.key === "Escape" && props.onClose()}
          >
            <div class="modal-backdrop" onClick={props.onClose} />
            <div class="modal-dialog">
              <div class="modal-header">
                {props.title}
                <Button round color="translucent" onClick={props.onClose}>
                  <i class="icon icon-close" />
                </Button>
              </div>
              <div class="modal-content custom-scroll">{props.children}</div>
            </div>
          </div>
        </Portal>
      )}
    </Show>
  );
}
```

```tsx
// common/Avatar.tsx — peer приходит как State: смена фото патчит <img>
export function Avatar(props: {
  peer: State<ApiPeer | undefined>;
  size?: "small" | "medium" | "large" | "jumbo";
}) {
  const photo = props.peer.map((p) => p && getPeerPhotoUrl(p)); // чистый селектор tt
  const initials = props.peer.map((p) => (p ? getPeerInitials(p) : ""));
  const color = props.peer.map((p) => (p ? getPeerColorClass(p) : ""));
  return (
    <div
      class={color.map((c) =>
        buildClassName("Avatar", `size-${props.size ?? "large"}`, c),
      )}
    >
      <Show
        when={photo}
        fallback={() => <span class="initials">{initials}</span>}
      >
        {() => (
          <img
            class="avatar-media"
            src={photo as State<string>}
            alt=""
            decoding="async"
          />
        )}
      </Show>
    </div>
  );
}
```

## 5. Левая колонка: ChatList

tt: `useInfiniteScroll` даёт `viewportIds`, каждый `<Chat>` абсолютно спозиционирован по `offsetTop = index * CHAT_HEIGHT_PX`, `useOrderDiff` анимирует перестановку. У нас окно — формула над скроллом, перестановка — `each` с LIS плюс CSS-transition по `top`.

```tsx
// left/main/ChatList.tsx
const CHAT_HEIGHT_PX = 72;
const SLICE = 30;

export function ChatList(props: { folderId: State<number> }) {
  const container = (<div class="chat-list custom-scroll" />) as HTMLElement;

  // порядок чатов папки — чистый селектор tt (folderManager); параметр-State
  // через combine, без flatten и пересоздания узла
  const ids = selectWith(
    chats,
    props.folderId,
    selectOrderedChatIds,
    shallowEqual,
  );

  // окно: из позиции скролла — [from, to) с запасом в SLICE
  const scroll = createScroll(container);
  const size = createSize(container);
  const range = combine(scroll, size, (s, sz) => {
    const first = Math.floor(s.top / CHAT_HEIGHT_PX);
    const count = Math.ceil(sz.height / CHAT_HEIGHT_PX);
    return { from: Math.max(0, first - SLICE), to: first + count + SLICE };
  });
  const viewport = combine(ids, range, (all, r) =>
    all.slice(r.from, r.to).map((id, i) => ({ id, index: r.from + i })),
  );
  // подгрузка следующей страницы чатов, когда окно упёрлось в хвост
  const needMore = viewport.updates.filter(
    (v) => v.length && v[v.length - 1].index >= ids.sample().length - SLICE,
  );
  onCleanup(
    needMore.listen(() => dispatch.loadMoreChats({ listType: "active" })),
  );

  const totalHeight = ids.map((all) => all.length * CHAT_HEIGHT_PX);
  container.append(
    <div
      class="scroll-container"
      style={totalHeight.map((h) => `height:${h}px`)}
    >
      {each(
        viewport,
        (v) => v.id,
        (v, row) => (
          <Chat
            chatId={v.id}
            offsetTop={row.map((r) => r.index * CHAT_HEIGHT_PX)}
          />
        ),
      )}
    </div>,
  );
  return container;
}
```

```tsx
// left/main/Chat.tsx — строка живёт, пока её id в окне; все поля — live
export function Chat(props: { chatId: string; offsetTop: State<number> }) {
  const chat = chatById(props.chatId); // keyed: обновится только при смене ЭТОГО чата
  const user = userById(props.chatId); // для личек
  const lastMessage = flatten(
    chat.map((c) =>
      c?.lastMessageId
        ? messageById(props.chatId, c.lastMessageId)
        : constant(undefined),
    ),
  );
  const isSelected = isChatOpen(props.chatId); // selector(): O(2)
  const unread = chat.map((c) => c?.unreadCount ?? 0);
  const isPinned = chat.map((c) => !!c?.isPinned);
  const typing = flatten(
    messagesByChat(props.chatId).map(
      (cm) => cm?.threadsById[MAIN_THREAD_ID]?.typingStatus,
    ),
  ); // через ячейку keyed

  const open = () =>
    dispatch.openChat({ id: props.chatId, shouldReplaceHistory: true });

  return (
    <ListItem
      className={combine(isSelected, isPinned, (s, p) =>
        buildClassName(
          "Chat chat-item-clickable",
          s && "selected",
          p && "pinned",
        ),
      )}
      style={props.offsetTop.map((t) => `top:${t}px`)}
      onClick={open}
      onContextMenu={(e) => {
        e.preventDefault();
        openChatMenu(props.chatId, e);
      }}
    >
      <div class="status">
        <Avatar peer={combine(chat, user, (c, u) => u ?? c)} size="large" />
      </div>
      <div class="info">
        <div class="info-row">
          <FullNameTitle peer={combine(chat, user, (c, u) => u ?? c)} />
          <div class="separator" />
          <LastMessageMeta message={lastMessage} />
        </div>
        <div class="subtitle">
          <Show
            when={typing}
            fallback={() => (
              <p class="last-message">{lastMessage.map(renderSummary)}</p>
            )}
          >
            {() => <TypingStatus status={typing} />}
          </Show>
          <Badge
            unread={unread}
            isPinned={isPinned}
            muted={chat.map((c) => !!c?.isMuted)}
          />
        </div>
      </div>
    </ListItem>
  );
}
```

Анимация перестановки чата (в tt `useOrderDiff` + `animationType`): `top` привязан к `State`, значит смена позиции — одна запись `style.top`; `transition: top .3s` в scss делает остальное. Для «нового сверху» tt добавляет класс `new`; у нас — `onMount(() => el.classList.add("new"))` плюс `transitionend`.

## 6. Средняя колонка: MessageList

Порт `MessageList.tsx` — самого сложного файла tt. Его части и наши эквиваленты:

| tt                                                                                                        | у нас                                                                             |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `messageIds` из `selectCurrentMessageIds`, `messagesById`                                                 | `select(...)`                                                                     |
| `renderData` + `groupMessages(...)` в `useMemo`                                                           | `combine(ids, byId, …).map(groupMessages)`                                        |
| `useStickyDates` (IntersectionObserver по датам)                                                          | `createVisibility` на каждом `.sticky-date`                                       |
| `rememberScrollPositionRef` + `forceMeasure` + `useLayoutEffectWithPrevDeps` + `requestMessageListReflow` | `measure(loadTrigger, snapshot)` → запись в listener → `measure(list.updates, …)` |
| `loadMoreAround` debounced                                                                                | `debounce(nearEdge, 300)` → `dispatch.loadViewportMessages`                       |
| `beginHeavyAnimation(SELECT_MODE_ANIMATION_DURATION)`                                                     | то же                                                                             |
| `is-animating` пока `!isReady`                                                                            | класс от `State<boolean>`                                                         |
| polling реакций/комментариев `useInterval`                                                                | `interval(20_000).when(isActive)` → `perform`                                     |

```tsx
// middle/MessageList.tsx
export function MessageList(props: {
  chatId: State<string>;
  threadId: State<ThreadId>;
  type: State<MessageListType>;
}) {
  const container = (
    <div
      class="MessageList custom-scroll"
      onMousedown={preventMessageInputBlur}
    />
  ) as HTMLElement;
  const list = (<div class="messages-container" />) as HTMLElement;
  container.append(list);

  // --- данные --------------------------------------------------------------
  // словарь сообщений чата — ячейка keyed: меняется только когда меняется ЭТОТ чат
  const chatMessages = flatten(props.chatId.map((id) => messagesByChat(id)));
  const messageIds = dedupe(
    combine(
      chatMessages,
      props.threadId,
      props.type,
      (cm, t, type) => cm && selectViewportIdsOf(cm, t, type),
    ),
    shallowEqual,
  );
  const messagesById = chatMessages.map((cm) => cm?.byId ?? {});
  const firstUnreadId = combine(
    chatMessages,
    props.threadId,
    (cm, t) => cm && selectFirstUnreadIdOf(cm, t),
  );
  const isViewportNewest = combine(
    chatMessages,
    props.threadId,
    (cm, t) => !!cm && selectIsViewportNewestOf(cm, t),
  );
  const isChatWithSelf = selectWith(users, props.chatId, selectIsChatWithSelf);

  // groupMessages — функция tt без изменений
  const groups = combine(
    messageIds,
    messagesById,
    firstUnreadId,
    isChatWithSelf,
    (ids, byId, unreadId, withSelf) =>
      ids
        ? groupMessages(
            orderBy(ids.map((id) => byId[id]).filter(Boolean), ["date", "id"]),
            unreadId,
            props.threadId.sample(),
            withSelf,
            true,
          )
        : [],
  );

  // --- подгрузка истории у краёв ------------------------------------------
  const scroll = createScroll(container);
  const nearTop = scroll.updates.filter((p) => p.top < SCROLL_THRESHOLD);
  // расстояние до низа — без чтений layout в графе: высота контейнера из
  // createSize, высота контента измеряется один раз на изменение списка
  const size = createSize(container);
  const contentHeight = measure(groups.updates, () => list.scrollHeight).hold(
    0,
  );
  const nearBottom = combine(
    scroll,
    size,
    contentHeight,
    (p, s, h) => h - p.top - s.height < SCROLL_THRESHOLD,
  ).updates.filter(Boolean);
  onCleanup(
    debounce(nearTop, 300).listen(() =>
      dispatch.loadViewportMessages({ direction: LoadMoreDirection.Backwards }),
    ),
  );
  onCleanup(
    debounce(nearBottom.when(isViewportNewest.map((n) => !n)), 300).listen(() =>
      dispatch.loadViewportMessages({ direction: LoadMoreDirection.Forwards }),
    ),
  );

  // --- якорь скролла (порт rememberScrollPositionRef + requestMessageListReflow) ---
  // tt запоминает второй .message-list-item и его top; при вставке сверху
  // находит его снова и смещает scrollTop на разницу. У нас — та же логика,
  // чтение до записи = measure на триггере загрузки, чтение после = measure
  // на изменении списка.
  type Anchor = { id: number; top: number; scrollTop: number } | null;
  const anchor = state<Anchor>(null);
  const snapshot = (): Anchor => {
    const item =
      list.querySelectorAll<HTMLElement>(".message-list-item")[1] ??
      list.querySelector<HTMLElement>(".message-list-item");
    return item
      ? {
          id: Number(item.dataset.messageId),
          top: item.getBoundingClientRect().top,
          scrollTop: container.scrollTop,
        }
      : null;
  };
  onCleanup(measure(nearTop, snapshot).listen((a) => anchor.set(a)));
  onCleanup(
    measure(groups.updates, () => {
      const a = anchor.sample();
      if (!a) return null;
      const item = list.querySelector<HTMLElement>(
        `[data-message-id="${a.id}"]`,
      );
      return item ? { a, newTop: item.getBoundingClientRect().top } : null;
    }).listen((r) => {
      if (!r) return;
      anchor.set(null);
      container.scrollTop = r.a.scrollTop + (r.newTop - r.a.top);
    }),
  );
  // отправка своего сообщения / live tail: прокрутка вниз (tt: animateScroll)
  const added = messagesById.updates.map(getAddedMessageInfo); // чистая функция tt
  onCleanup(
    added
      .filter(
        (i) =>
          i.areAddedMessagesOutgoing ||
          (isViewportNewest.sample() && isAtBottom.sample()),
      )
      .listen(() =>
        animateScroll(
          container,
          list.lastElementChild as HTMLElement,
          "end",
          MESSAGE_ANIMATION_DURATION,
        ),
      ),
  );

  // --- sticky dates (useStickyDates) ----------------------------------------
  const isScrolled = scroll.map((p) => p.top > 0);
  // видимость строк (прочтение, polling реакций) — ОДИН observer на список
  const observe = createVisibilityObserver({ root: container });

  // --- рендер --------------------------------------------------------------
  const held = holdWhile(groups, isHeavyAnimating);
  list.append(
    each(
      held,
      (g) => g.key,
      (g, group) => (
        <div class="message-date-group">
          <div
            class={isScrolled.map((s) =>
              buildClassName("sticky-date", s && "is-scrolled"),
            )}
          >
            <span>{formatDateToString(g.date)}</span>
          </div>
          {each(
            group.map((gg) => gg.senderGroups),
            (sg) => sg.key,
            (sg) => (
              <div class="sender-group">
                {each(
                  sg.messages,
                  (m) => m.id,
                  (m, row) => (
                    <Message
                      message={row}
                      observe={observe}
                      isFirstInGroup={m === sg.messages[0]}
                      isLastInGroup={m === sg.messages[sg.messages.length - 1]}
                      withAvatar={!isChatWithSelf.sample()}
                    />
                  ),
                )}
              </div>
            ),
          )}
        </div>
      ),
    ),
  );
  bindClass(container, "is-animating", isHeavyAnimating);
  bindClass(container, "scrolled", isScrolled);
  return container;
}
```

```ts
// lib/dom.ts
export const bindClass = (el: Element, name: string, on: State<boolean>) =>
  onCleanup(on.listen((v) => el.classList.toggle(name, v)));
```

### Message

tt: `Message.tsx` ~1500 строк, `memo(withGlobal(…))`, десятки `useMemo`/`useLastCallback`. У нас сообщение — `State<ApiMessage>` (второй аргумент `each`): правка, реакции, статус доставки — всё патчи.

```tsx
// middle/message/Message.tsx
export function Message(props: {
  message: State<ApiMessage>;
  observe: (el: Element) => State<boolean>;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  withAvatar: boolean;
}) {
  const m = props.message;
  const id = m.sample().id;
  const isOwn = m.map((x) => x.isOutgoing);
  const sender = flatten(
    m.map((x) => (x.senderId ? userById(x.senderId) : chatById(x.chatId))),
  );
  const text = m.map((x) => x.content.text);
  const reactions = m.map((x) => x.reactions);
  const isEdited = m.map((x) => !!x.isEdited);
  const isSelected = isMessageSelected(id); // selector() над множеством выбранных
  const isFocused = isMessageFocused(id); // selector() над focusingId
  const hasReply = m.map((x) => !!x.replyInfo);
  const media = m.map(getMessageContent); // чистая: photo | video | document | …

  const cls = combine(
    isOwn,
    isSelected,
    isFocused,
    hasReply,
    (own, sel, foc, rep) =>
      buildClassName(
        "Message message-list-item",
        own ? "own" : "",
        props.isFirstInGroup && "first-in-group",
        props.isLastInGroup && "last-in-group",
        sel && "is-selected",
        foc && "focused",
        rep && "has-reply",
      ),
  );

  const el = (
    <div
      class={cls}
      data-message-id={String(id)}
      onContextMenu={(e) => openMessageMenu(e, id)}
    />
  ) as HTMLElement;
  // tt: useIntersectionObserver → markMessagesRead; у нас — ячейка общего observer
  onCleanup(
    props
      .observe(el)
      .updates.filter(Boolean)
      .listen(() => dispatch.markMessageRead({ id })),
  );
  el.append(
    <>
      {props.withAvatar && props.isLastInGroup && (
        <Avatar peer={sender} size="small" />
      )}
      <div class="message-content-wrapper">
        <div
          class={media.map((md) =>
            buildClassName(
              "message-content",
              md.photo && "media",
              text.sample() && "text",
            ),
          )}
        >
          {props.isFirstInGroup && !isOwn.sample() && (
            <MessageSender sender={sender} />
          )}
          <Show when={hasReply}>{() => <EmbeddedMessage message={m} />}</Show>
          <Dynamic value={media}>
            {(md) =>
              md.photo ? (
                <Photo photo={md.photo} message={m} />
              ) : md.video ? (
                <Video video={md.video} />
              ) : md.document ? (
                <Document document={md.document} />
              ) : null
            }
          </Dynamic>
          <Show when={text}>
            {() => (
              <p class="text-content" dir="auto">
                {text.map((t) => renderTextWithEntities(t!))}
                <MessageMeta message={m} />
              </p>
            )}
          </Show>
          <Show when={reactions.map((r) => !!r?.results.length)}>
            {() => (
              <Reactions
                reactions={reactions as State<ApiReactions>}
                messageId={id}
              />
            )}
          </Show>
        </div>
      </div>
    </>,
  );
  return el;
}
```

`renderTextWithEntities` — функция tt, возвращает массив узлов; у нас JSX-child принимает `Node[]`, так что переносится без изменений (там, где она строит `<a>`/`<code>`/spoiler).

```tsx
// middle/message/MessageMeta.tsx — время, edited, статус, просмотры
export function MessageMeta(props: { message: State<ApiMessage> }) {
  const m = props.message;
  return (
    <span class="MessageMeta" dir="ltr">
      <Show when={m.map((x) => !!x.isEdited)}>
        {() => <span class="message-edited">{lang("EditedMessage")}</span>}
      </Show>
      <span class="message-time">{m.map((x) => formatTime(x.date))}</span>
      <Show when={m.map((x) => x.isOutgoing)}>
        {() => (
          <MessageOutgoingStatus status={m.map((x) => getOutgoingStatus(x))} />
        )}
      </Show>
    </span>
  );
}
```

## 7. Composer

tt: `Composer.tsx` + `MessageInput.tsx` (contenteditable, `useState` для html, `useEffect` синхронизации). У нас contenteditable — внешний мир: пишем в него через `withLayout`, читаем через `input`-событие.

```tsx
// middle/composer/MessageInput.tsx
export function MessageInput(props: {
  html: StateSource<string>;
  onSend: () => void;
  placeholder: State<string>;
}) {
  const el = (
    <div
      class="form-control allow-selection"
      contenteditable
      role="textbox"
      dir="auto"
      onInput={(e) =>
        props.html.set((e.currentTarget as HTMLElement).innerHTML)
      }
      onKeydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          props.onSend();
        }
      }}
    />
  ) as HTMLDivElement;
  // внешние записи (драфт, "очистить после отправки") — только если отличаются
  onCleanup(
    props.html.listen((h) => {
      if (el.innerHTML !== h) el.innerHTML = h;
    }),
  );
  const isEmpty = props.html.map((h) => !h.trim());
  return (
    <div class="message-input-wrapper">
      <div
        class={isEmpty.map((e) =>
          buildClassName("placeholder-text", !e && "hidden"),
        )}
      >
        {props.placeholder}
      </div>
      {el}
    </div>
  );
}
```

```tsx
// middle/composer/Composer.tsx
export function Composer(props: {
  chatId: State<string>;
  threadId: State<ThreadId>;
}) {
  const html = state("");
  // драфт из стора при смене чата, сохранение в стор с дебаунсом (tt: useDraft)
  const draft = combine(
    messages,
    props.chatId,
    props.threadId,
    (m, id, t) => selectDraft(m, id, t)?.text ?? "",
  );
  onCleanup(draft.listen((d) => html.set(d)));
  onCleanup(
    debounce(html.updates, 500).listen((text) =>
      dispatch.saveDraft({
        chatId: props.chatId.sample(),
        threadId: props.threadId.sample(),
        text,
      }),
    ),
  );

  const attachments = state<ApiAttachment[]>([]);
  const canSend = combine(
    html,
    attachments,
    (h, a) => !!h.trim() || a.length > 0,
  );
  const isRecording = state(false);

  const send = () => {
    if (!canSend.sample()) return;
    batch(() => {
      dispatch.sendMessage({
        chatId: props.chatId.sample(),
        threadId: props.threadId.sample(),
        text: parseHtmlAsFormattedText(html.sample()),
        attachments: attachments.sample(),
      });
      html.set("");
      attachments.set([]);
    });
  };

  return (
    <div class="Composer">
      <AttachMenu attachments={attachments} />
      <div class="composer-wrapper">
        <EmojiButton onPick={(e) => html.update((h) => h + e)} />
        <MessageInput
          html={html}
          onSend={send}
          placeholder={flatten(props.chatId.map(chatById)).map((c) =>
            composerPlaceholderFor(c),
          )}
        />
        <Button
          round
          color="translucent"
          className="composer-action-button"
          onClick={() => dispatch.openStickerPicker()}
        >
          <i class="icon icon-sticker" />
        </Button>
      </div>
      <Dynamic
        value={combine(canSend, isRecording, (c, r) =>
          r ? "recording" : c ? "send" : "record",
        )}
      >
        {(mode) =>
          mode === "send" ? (
            <Button
              round
              color="secondary"
              className="send"
              ariaLabel="Send"
              onClick={send}
            >
              <i class="icon icon-send" />
            </Button>
          ) : (
            <Button
              round
              color="secondary"
              className="record"
              onMousedown={() => isRecording.set(true)}
            >
              <i class="icon icon-microphone-alt" />
            </Button>
          )
        }
      </Dynamic>
    </div>
  );
}
```

Оптимистичная отправка в tt: `sendMessage` сразу кладёт локальное сообщение с `localId`, апдейт `updateMessageSendSucceeded` заменяет его. У нас это буквально два reducer-кейса; строка сообщения получает новый объект через `row` — `MessageOutgoingStatus` переключается с «часиков» на галочку без перестройки.

## 8. Колонки, роутинг, Main

tt роутит хэшем (`#123456`, `#-100…_thread`), `Main.tsx` раскладывает `LeftColumn`/`MiddleColumn`/`RightColumn`, состояние колонок в слайсе `ui`.

```tsx
// components/main/Main.tsx
export function Main() {
  const isLeftOpen = select(ui, (u) => u.isLeftColumnShown);
  const isRightOpen = select(ui, (u) => u.isRightColumnShown);
  const messageList = select(ui, (u) => u.messageList, shallowEqual);
  const hasChat = messageList.map((m) => !!m);

  // хэш ↔ стор (tt: useHistoryBack + hash в openChat)
  onCleanup(
    location()
      .map(parseHash)
      .listen((parsed) => parsed && dispatch.openChat(parsed)),
  );

  return (
    <div
      id="Main"
      class={combine(isLeftOpen, isRightOpen, (l, r) =>
        buildClassName(
          "Main",
          l && "is-left-column-shown",
          r && "is-right-column-shown",
        ),
      )}
    >
      <LeftColumn />
      <Dynamic value={hasChat}>
        {(has) =>
          has ? (
            <MiddleColumn
              chatId={messageList.map((m) => m!.chatId)}
              threadId={messageList.map((m) => m!.threadId)}
              type={messageList.map((m) => m!.type)}
            />
          ) : (
            <div class="MiddleColumn empty" />
          )
        }
      </Dynamic>
      <Show when={isRightOpen}>
        {() => <RightColumn chatId={messageList.map((m) => m?.chatId)} />}
      </Show>
      <Notifications />
      <Dialogs />
    </div>
  );
}
```

```tsx
// middle/MiddleColumn.tsx
export function MiddleColumn(props: { chatId: State<string>; threadId: State<ThreadId>; type: State<MessageListType> }) {
  const canPost = combine(chatById(props.chatId.sample()), props.threadId, (chat, t) => !!chat && selectCanPostIn(chat, t));
  const bg = select(ui, (u) => u.theme.background);
  // переход между чатами — Transition с heavy-animation, список под holdWhile
  const activeKey = props.chatId.updates.accum(0, (_, n) => n + 1);
  return (
    <div class="MiddleColumn" style={bg.map((b) => `--theme-background-image:url(${b})`)}>
      <div class="messages-layout">
        <MiddleHeader chatId={props.chatId} threadId={props.threadId} />
        <Transition name="slide" activeKey={activeKey} className="messages-layout-content">
          {() => <MessageList chatId={props.chatId} threadId={props.threadId} type={props.type} />}
        </Transition>
        <Show when={canPost} fallback={() => <MessageSelectToolbar />}>
          {() => <Composer chatId={props.chatId} threadId={props.threadId} />}
        </Show>
        <ScrollDownButton listRef={…} />
      </div>
    </div>
  );
}
```

## 9. Что переносится дословно

- Весь `src/api` (gramjs, воркер, типы).
- Все `reducers/*` и `selectors/*` — чистые функции над `GlobalState`.
- `helpers/groupMessages`, `renderTextWithEntities`, `buildClassName`, `formatDate*`, `animateScroll` (с заменой `requestMutation` → прямая запись в listener).
- Все `.scss` и классы — JSX выше использует их имена.
- Иконки, lottie-стикеры, медиа-лоадеры (`mediaLoader` — императивный кэш, стыкуется через `perform`).

## 10. Что исчезает

- `withGlobal`/`mapStateToProps`, `memo`, `useLastCallback`, `useStateRef`, `useFlag`, `useSyncEffect`, `useEffectWithPrevDeps`, `useLayoutEffectWithPrevDeps` — нет ререндеров, нечего стабилизировать.
- `teactFastList`/`teactOrderKey`, `useOrderDiff` — `each` + CSS `top`.
- `fasterdom` целиком — кадровый проход, `measure`, `forceMeasure`.
- `useInfiniteScroll`, `InfiniteScroll` — `createScroll` + `combine`.
- `addActionHandler` с `global`/`actions` аргументами — `reduceX` по слайсам + `perform`.
- `TeactN` и монолитный `global` — слайсы-`State` + ячейки.

## 11. Что ушло во фреймворк, что осталось в клиенте

Этой же веткой во фреймворк добавлено: **`keyed`** (frp — ячейки по ключу над словарём), **`asState`** (dom), **`createVisibilityObserver`** (dom/layout — один observer на список). В клиенте остаются три вещи, все уже лежат в `examples/tweb-a` с тестами:

| Что                                   | Где                    | Что проверено тестом                                                                                                                                                                     |
| ------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Transition` (slide/fade, два слоя)   | `ui/Transition.tsx`    | уходящий слой живёт — и его привязки работают — до `transitionend`; heavy-animation на время перехода; второй switch посреди анимации; unmount dispose'ит все слои                       |
| `MessageInput` (contenteditable)      | `ui/MessageInput.tsx`  | внешняя запись только при различии (0 эхо-записей при печати); во время IME-композиции внешние записи пропускаются, после — текст пользователя побеждает; Enter/Shift+Enter; placeholder |
| `animateScroll` без `requestMutation` | `lib/animateScroll.ts` | измерение в кадровом проходе, запись в кадр, повторный вызов перехватывает                                                                                                               |

Плюс пять строк `bindClass`/`bindClassName` в `lib/dom.ts`.

Единственное место, где надо думать о производительности, — выбор между `select` и `keyed` (раздел 2): всё «по id» идёт через `keyed`, иначе fine-grained поверх стора вырождается в «все слушают всё».
