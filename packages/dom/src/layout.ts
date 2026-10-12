// Continuum — layout as an effect (law 3).
//
// Layout is the outside world. It enters the network as State through the
// browser's own observers — which run after layout, before paint, with the
// values already computed, so they never force a reflow — or through
// `measure`, a read batched into the frame pass: all reads of a frame run
// together, before any write, and their results enter as ONE moment.

import {
  state,
  stream,
  batch,
  requestMeasure,
  withLayout,
  type State,
  type StateSource,
  type Stream,
} from "@continuum-js/frp";
import { onCleanup } from "./index.js";

/** Width/height of an element's content box, live via ResizeObserver. */
export function createSize(
  el: Element,
): State<{ width: number; height: number }> {
  const size = state(
    { width: 0, height: 0 },
    (a, b) => a.width === b.width && a.height === b.height,
  );
  const ro = new ResizeObserver((entries) => {
    const r = entries[entries.length - 1].contentRect;
    size.set({ width: r.width, height: r.height });
  });
  ro.observe(el);
  onCleanup(() => ro.disconnect());
  return size;
}

/** Whether an element intersects the viewport (or `opts.root`), live via IntersectionObserver. */
export function createVisibility(
  el: Element,
  opts?: IntersectionObserverInit,
): State<boolean> {
  const visible = state(false);
  const io = new IntersectionObserver((entries) => {
    visible.set(entries[entries.length - 1].isIntersecting);
  }, opts);
  io.observe(el);
  onCleanup(() => io.disconnect());
  return visible;
}

/**
 * ONE IntersectionObserver for a whole list: returns `observe(el)`, which
 * hands out a `State<boolean>` per element. Each cell unobserves when its
 * owner is disposed; the observer disconnects with the owner that created
 * it. Prefer this over `createVisibility` for rows — 300 messages must not
 * mean 300 observers.
 */
export function createVisibilityObserver(
  opts?: IntersectionObserverInit,
): (el: Element) => State<boolean> {
  const cells = new Map<Element, StateSource<boolean>>();
  const io = new IntersectionObserver((entries) => {
    batch(() => {
      for (const e of entries) cells.get(e.target)?.set(e.isIntersecting);
    });
  }, opts);
  onCleanup(() => {
    io.disconnect();
    cells.clear();
  });
  return (el) => {
    let cell = cells.get(el);
    if (!cell) {
      cell = state(false);
      cells.set(el, cell);
      io.observe(el);
      onCleanup(() => {
        io.unobserve(el);
        cells.delete(el);
      });
    }
    return cell;
  };
}

/** Scroll offset of an element or the window, live via the `scroll` event. */
export function createScroll(
  target: Element | Window,
): State<{ top: number; left: number }> {
  const read = () =>
    target instanceof Window
      ? { top: target.scrollY, left: target.scrollX }
      : {
          top: (target as Element).scrollTop,
          left: (target as Element).scrollLeft,
        };
  const pos = state(read(), (a, b) => a.top === b.top && a.left === b.left);
  const onScroll = () => pos.set(read());
  target.addEventListener("scroll", onScroll, { passive: true });
  onCleanup(() => target.removeEventListener("scroll", onScroll));
  return pos;
}

// Results of this frame's measures, fired together as one moment once every
// queued read has run (the flush is queued after the reads: FIFO).
let results: Array<() => void> = [];
let resultsQueued = false;

function fireResults(): void {
  resultsQueued = false;
  const rs = results;
  results = [];
  batch(() => {
    for (const r of rs) r();
  });
}

/**
 * A layout read as an effect: on each occurrence of `trigger`, `read` runs
 * in the frame pass — after this moment's writes, before paint, together
 * with every other measure of the frame — and its result enters the network
 * as an occurrence of the returned stream. One read per frame per measure
 * (the latest trigger wins). The results of all measures of a frame share
 * one moment, so the writes they cause coalesce into one pass.
 */
export function measure<A, B>(
  trigger: Stream<A>,
  read: (a: A) => B,
): Stream<B> {
  const out = stream<B>();
  let dead = false;
  let pending = false;
  let arg!: A;
  const un = trigger.listen((a) => {
    arg = a;
    if (pending) return;
    pending = true;
    requestMeasure(() => {
      pending = false;
      if (dead) return;
      const value = read(arg);
      results.push(() => out.fire(value));
      if (!resultsQueued) {
        resultsQueued = true;
        requestMeasure(fireResults);
      }
    });
  });
  onCleanup(() => {
    dead = true;
    un();
  });
  return out;
}

/**
 * Run `fn` outside the effect zone: an explicit layout read from an effect
 * (a third-party widget's init in `onMount`). Alias of the core `withLayout`.
 */
export const forceMeasure = withLayout;

const heavy = state(false);
let heavyCount = 0;

/** True while any `beginHeavyAnimation()` is in progress. */
export const isHeavyAnimating: State<boolean> = heavy;

/**
 * Mark a heavy animation (a page transition, a media viewer opening) so
 * expensive regions can hold still — `each(holdWhile(items, isHeavyAnimating), …)`.
 * Returns the end handle; `durationMs` ends it if nobody does.
 */
export function beginHeavyAnimation(durationMs = 1000): () => void {
  if (++heavyCount === 1) heavy.set(true);
  let ended = false;
  const timer = setTimeout(end, durationMs);
  function end(): void {
    if (ended) return;
    ended = true;
    clearTimeout(timer);
    if (--heavyCount === 0) heavy.set(false);
  }
  return end;
}
