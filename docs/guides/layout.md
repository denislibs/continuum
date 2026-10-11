# Layout

::: tip In plain words
Sizes, visibility and scroll positions enter as states; the rare measurement you must take by hand goes through `measure`. Reading layout inside a `listen`/`onMount` is the one thing to avoid — it forces a reflow between the renderer's writes.
:::

Layout is the outside world. Writing to it is the renderer's job; **reading**
it is an effect, and effects have a place: the frame pass. This guide is the
third law of the model in practice — _layout is an effect_ — and the API that
makes the right thing the easy thing.

## Why reads are the problem

The browser recomputes style and layout lazily: writes only mark the tree
dirty, and the cost comes when something **reads** a layout value while the
tree is dirty — that forces a synchronous reflow. Interleave a write, a read,
a write, a read, and you pay a reflow per read. This is "layout thrashing",
and in a list of a few hundred rows it is the difference between 60 fps and
a stutter.

The renderer writes in the frame pass. A `listen`, `onMount` or `perform`
callback also runs in that pass — so a layout read there lands exactly
between writes. The devtools' strict mode reports it, the lint rule
`no-layout-reads-in-effects` flags it statically, and the API below keeps you
out of it.

## Sizes, visibility, scroll: layout as State

The browser already has a measure phase of its own: `ResizeObserver` and
`IntersectionObserver` run after layout, before paint, with the values
computed — reading them forces nothing. `@continuum-js/dom/layout` turns them
into states:

```tsx
import {
  createSize,
  createVisibility,
  createScroll,
} from "@continuum-js/dom/layout";

function Chart() {
  const el = (<div class="chart" />) as HTMLElement;
  const size = createSize(el); // State<{ width, height }>
  const visible = createVisibility(el); // State<boolean>
  const scroll = createScroll(window); // State<{ top, left }>
  const bars = combine(size, data, (s, d) => layoutBars(d, s.width));
  return (
    <div>
      {el}
      <Show when={visible}>{() => <Legend bars={bars} />}</Show>
    </div>
  );
}
```

`size`, `visible` and `scroll` are ordinary states: map them, combine them,
bind them. They register with the component's owner (`createX` by
convention) and disconnect on unmount. Nothing in your code reads layout.

## `measure`: the read you must take yourself

Some measurements have no observer — the scroll height after an insertion,
an element's offset within its parent, a computed style. `measure` is a
layout read as an effect:

```ts
measure<A, B>(trigger: Stream<A>, read: (a: A) => B): Stream<B>
```

On each occurrence of `trigger`, `read` runs in the frame pass — **after this
moment's writes, before paint**, together with every other measure of the
frame — and its result enters the network as an occurrence of the returned
stream. Reads are batched: all of a frame's measures run back to back, so
the frame pays one reflow at most. Their results enter as **one moment**, so
the writes they cause coalesce into one pass as well.

Two rules follow from "one occurrence per moment": a measure reads at most
**once per frame**, with the latest trigger value (intermediate triggers are
dropped), and a `read` that throws does not stop the others — the error
surfaces from the frame pass.

### Scroll anchoring on history load

The classic use. When older messages are prepended, keep the viewport where
it was:

```tsx
import { measure } from "@continuum-js/dom/layout";

function MessageList(props: {
  messages: State<Message[]>;
  loadOlder: Stream<void>;
}) {
  const list = (<div class="messages" />) as HTMLElement;
  const inserted = props.messages.updates; // fires when the list changes

  // read BEFORE the insertion lands (the load request's frame) …
  const before = measure(props.loadOlder, () => ({
    height: list.scrollHeight,
    top: list.scrollTop,
  })).hold(null);
  // … and AFTER it (the insertion's frame, still before paint)
  const after = measure(inserted, () => list.scrollHeight);

  before
    .at(after, (b, height) => (b ? b.top + (height - b.height) : null))
    .listen((top) => {
      if (top != null) list.scrollTop = top; // a write — effects may write
    });

  return list;
}
```

The user never sees the jump: the correction is written in the same frame
the new rows appear in, before the browser paints either.

One rule falls out of the frame pass: a read that must happen **before** a
write cannot live in the effect that performs the write — effects run after
the round's writes. Make the write a _consequence_ of the measurement
instead: measure first, write in the result's listener. Above, the
`loadOlder` request takes a network round-trip, so the "before" read is
naturally a frame ahead of the insertion; when the prepend is synchronous
(the window grows from what is already loaded), the shape is
`measure(reachedTop, snapshot).listen((a) => { anchor.set(a); limit.update(…) })`
— the `examples/tweb-a` spike does exactly this.

## Opting out: `forceMeasure`

A third-party widget measures when it initializes, and it initializes in
`onMount`. That read is intentional — say so:

```tsx
import { forceMeasure } from "@continuum-js/dom/layout";

onMount(() => forceMeasure(() => new Chart(el)));
```

`forceMeasure` suspends the effect zone for the callback: strict mode and the
lint rule both see the intent. The same applies to `input.focus()` in
`onMount` — `focus()` forces layout — so the canonical "focus on mount" reads
`onMount(() => forceMeasure(() => input.focus()))`.

## Holding still during an animation

A page transition and a list that reconciles at the same time fight for the
frame. Mark the animation, and hold the expensive region:

```tsx
import {
  beginHeavyAnimation,
  isHeavyAnimating,
} from "@continuum-js/dom/layout";
import { holdWhile } from "@continuum-js/std";

const end = beginHeavyAnimation(300); // or let the duration end it
panel.addEventListener("transitionend", end, { once: true });

<Each each={holdWhile(messages, isHeavyAnimating)} by={(m) => m.id}>
  {(m) => <Row message={m} />}
</Each>;
```

`holdWhile` freezes the list while the gate is on and catches up in one step
when it ends; text and attribute bindings elsewhere keep updating.

## Seeing it

Install the devtools in development — the scaffold already does:

```ts
if (import.meta.env.DEV) {
  const { installDevtools } = await import("@continuum-js/devtools");
  installDevtools();
}
```

Strict mode throws on a layout read inside an effect, naming the property
and pointing at `measure`/`forceMeasure`; the overlay shows live scopes,
subscriptions, moments per second and the violation count.
