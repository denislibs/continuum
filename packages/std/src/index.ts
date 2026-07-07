// Continuum standard library (std).
// Reusable combinators built purely on the frp core — the everyday toolkit for
// real apps: timing, async data, stream shaping, behavior helpers. Nothing here
// touches internals the core doesn't already expose.

import { Event, Behavior, newEvent, perform } from "@continuum-js/frp";
import type { Unlisten } from "@continuum-js/frp";

// ===========================================================================
// Timing — bridges to the wall clock via setTimeout/setInterval. Each returns
// an event that tears its timer down on `dispose()`.
// ===========================================================================

/**
 * Emit only after `ms` of quiet, coalescing a burst into its last value.
 * (Trailing debounce.)
 */
export function debounce<A>(e: Event<A>, ms: number): Event<A> {
  const [out, fire] = newEvent<A>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const un = e.listen((a) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fire(a);
    }, ms);
  });
  out.onDispose(() => {
    un();
    if (timer !== undefined) clearTimeout(timer);
  });
  return out;
}

/**
 * Emit the leading occurrence immediately, then ignore further ones for `ms`.
 * (Leading throttle / rate limit.)
 */
export function throttle<A>(e: Event<A>, ms: number): Event<A> {
  const [out, fire] = newEvent<A>();
  let blocked = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const un = e.listen((a) => {
    if (blocked) return;
    blocked = true;
    fire(a);
    timer = setTimeout(() => {
      blocked = false;
    }, ms);
  });
  out.onDispose(() => {
    un();
    if (timer !== undefined) clearTimeout(timer);
  });
  return out;
}

/** Shift every occurrence later by `ms`, preserving order and multiplicity. */
export function delay<A>(e: Event<A>, ms: number): Event<A> {
  const [out, fire] = newEvent<A>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const un = e.listen((a) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fire(a);
    }, ms);
    timers.add(id);
  });
  out.onDispose(() => {
    un();
    for (const id of timers) clearTimeout(id);
    timers.clear();
  });
  return out;
}

/** A source event ticking `1, 2, 3, …` every `ms`. Stops on `dispose()`. */
export function interval(ms: number): Event<number> {
  const [out, fire] = newEvent<number>();
  let n = 0;
  const id = setInterval(() => fire(++n), ms);
  out.onDispose(() => clearInterval(id));
  return out;
}

// ===========================================================================
// Stream shaping — derived events over the graph (glitch-free, rank-ordered).
// ===========================================================================

/** Map, dropping occurrences whose result is `null`/`undefined`. */
export function filterMap<A, B>(
  e: Event<A>,
  f: (a: A) => B | null | undefined,
): Event<B> {
  const out = new Event<B>(e.rank + 1);
  out.consume(e, (t, a) => {
    const b = f(a);
    if (b != null) out.send_(t, b);
  });
  return out;
}

/** Pair each occurrence with the previous one; emits from the 2nd occurrence. */
export function pairwise<A>(e: Event<A>): Event<[A, A]> {
  const out = new Event<[A, A]>(e.rank + 1);
  let hasPrev = false;
  let prev: A;
  out.consume(e, (t, a) => {
    if (hasPrev) out.send_(t, [prev, a]);
    prev = a;
    hasPrev = true;
  });
  return out;
}

/** Split a stream by a predicate into `[matching, rest]`. */
export function partition<A>(
  e: Event<A>,
  pred: (a: A) => boolean,
): [Event<A>, Event<A>] {
  return [e.filter(pred), e.filter((a) => !pred(a))];
}

/** A behavior of how many times the event has occurred. */
export function count(e: Event<unknown>): Behavior<number> {
  return e.accum(0, (_a, n) => n + 1);
}

/** Sample `b` at each occurrence of `trigger`, discarding the trigger's value. */
export function sampleWith<A, B>(trigger: Event<A>, b: Behavior<B>): Event<B> {
  return trigger.snapshot(b, (_a, v) => v);
}

// ===========================================================================
// Behavior helpers.
// ===========================================================================

/** A behavior lagging one step behind `b` (its value before the latest change). */
export function previous<A>(b: Behavior<A>, init: A): Behavior<A> {
  // At the instant of an update, `b` still samples its pre-commit (prior) value,
  // since `hold` commits at the moment boundary.
  return b.updates.snapshot(b, (_new, old) => old).hold(init);
}

/** A behavior that suppresses updates equal to the current value (default `Object.is`). */
export function distinctB<A>(
  b: Behavior<A>,
  eq: (x: A, y: A) => boolean = Object.is,
): Behavior<A> {
  const out = new Event<A>(b.updates.rank + 1);
  let prev = b.sampleNoTrans();
  b.updates.listen_(out, (t, a) => {
    if (!eq(prev, a)) {
      prev = a;
      out.send_(t, a);
    }
  });
  return new Behavior<A>(() => b.sampleNoTrans(), out);
}

// ===========================================================================
// Async data — HTTP and friends. `perform` is the IO boundary (§6.5): the
// effect runs after the moment closes and its result re-enters the network as
// data, with failures reified into a Result rather than thrown.
// ===========================================================================

/** The lifecycle of an asynchronous request as first-class data. */
export type Async<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; value: T }
  | { status: "error"; error: unknown };

/**
 * Turn a stream of requests into a behavior tracking the async lifecycle
 * (`idle → loading → ok | error`). Requests are stamped with a sequence number,
 * so a slow response to a superseded request is ignored (last-request-wins) —
 * the classic out-of-order-response bug, solved declaratively.
 */
export function resource<A, T>(
  trigger: Event<A>,
  fetcher: (arg: A) => Promise<T>,
): Behavior<Async<T>> {
  const requests = trigger.accumE({ seq: 0, arg: null as A }, (arg, prev) => ({
    seq: prev.seq + 1,
    arg,
  }));

  const latest = requests.map((r) => r.seq).hold(0);

  const responses = perform(requests, (r) =>
    fetcher(r.arg).then((value) => ({ seq: r.seq, value })),
  );

  const settled = responses
    .snapshot(latest, (res, latestSeq): Async<T> | null => {
      if (res.ok) {
        if (res.value.seq !== latestSeq) return null; // superseded — ignore
        return { status: "ok", value: res.value.value };
      }
      return { status: "error", error: res.error };
    })
    .filter((s) => s !== null) as Event<Async<T>>;

  const loading = requests.mapTo<Async<T>>({ status: "loading" });

  // loading (request moment) and settled (later moment) never coincide.
  return loading.orElse(settled).hold({ status: "idle" });
}

// ===========================================================================
// Persistence — a sink at the boundary: mirror a behavior into a Storage.
// ===========================================================================

/** The slice of the Storage interface persistence relies on. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/**
 * Read a persisted value back, or `fallback` when the key is missing, the
 * JSON is corrupted, or storage is unavailable (SSR) — loading state must
 * never be the reason an app fails to start.
 */
export function loadPersisted<T>(
  key: string,
  fallback: T,
  storage: StorageLike | undefined = globalThis.localStorage,
): T {
  try {
    const raw = storage?.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * Mirror every value of `b` (including the current one) into storage as JSON.
 * Best-effort: a throwing `setItem` (quota, private mode) is swallowed — the
 * network must not break because a mirror did. Returns the unlisten; tie it
 * to a scope (`onCleanup(persist(key, b))`) or keep it for a manual stop.
 */
export function persist<T>(
  key: string,
  b: Behavior<T>,
  storage: StorageLike | undefined = globalThis.localStorage,
): Unlisten {
  if (!storage) return () => {};
  return b.listen((v) => {
    try {
      storage.setItem(key, JSON.stringify(v));
    } catch {
      // best-effort by contract
    }
  });
}
