// Continuum standard library (std).
// Reusable combinators built purely on the frp core — the everyday toolkit for
// real apps: timing, async data, stream shaping, behavior helpers. Nothing here
// touches internals the core doesn't already expose.

import { Stream, State, stream, perform } from "@continuum-js/frp";
import type { Unlisten } from "@continuum-js/frp";

// ===========================================================================
// Timing — bridges to the wall clock via setTimeout/setInterval. Each returns
// an event that tears its timer down on `dispose()`.
// ===========================================================================

/**
 * Emit only after `ms` of quiet, coalescing a burst into its last value.
 * (Trailing debounce.)
 */
export function debounce<A>(e: Stream<A>, ms: number): Stream<A> {
  const out = stream<A>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const un = e.listen((a) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      out.fire(a);
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
export function throttle<A>(e: Stream<A>, ms: number): Stream<A> {
  const out = stream<A>();
  let blocked = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const un = e.listen((a) => {
    if (blocked) return;
    blocked = true;
    out.fire(a);
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
export function delay<A>(e: Stream<A>, ms: number): Stream<A> {
  const out = stream<A>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const un = e.listen((a) => {
    const id = setTimeout(() => {
      timers.delete(id);
      out.fire(a);
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
export function interval(ms: number): Stream<number> {
  const out = stream<number>();
  let n = 0;
  const id = setInterval(() => out.fire(++n), ms);
  out.onDispose(() => clearInterval(id));
  return out;
}

// ===========================================================================
// Stream shaping — derived events over the graph (glitch-free, rank-ordered).
// ===========================================================================

/** Map, dropping occurrences whose result is `null`/`undefined`. */
export function filterMap<A, B>(
  e: Stream<A>,
  f: (a: A) => B | null | undefined,
): Stream<B> {
  const out = new Stream<B>(e.rank + 1);
  out.consume(e, (t, a) => {
    const b = f(a);
    if (b != null) out.send_(t, b);
  });
  return out;
}

/** Pair each occurrence with the previous one; emits from the 2nd occurrence. */
export function pairwise<A>(e: Stream<A>): Stream<[A, A]> {
  const out = new Stream<[A, A]>(e.rank + 1);
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
  e: Stream<A>,
  pred: (a: A) => boolean,
): [Stream<A>, Stream<A>] {
  return [e.filter(pred), e.filter((a) => !pred(a))];
}

/** A behavior of how many times the event has occurred. */
export function count(e: Stream<unknown>): State<number> {
  return e.accum(0, (_a, n) => n + 1);
}

/** Sample `b` at each occurrence of `trigger`, discarding the trigger's value. */
export function sampleWith<A, B>(trigger: Stream<A>, b: State<B>): Stream<B> {
  return b.at(trigger);
}

// ===========================================================================
// State helpers.
// ===========================================================================

/** A behavior lagging one step behind `b` (its value before the latest change). */
export function previous<A>(b: State<A>, init: A): State<A> {
  // At the instant of an update, `b` still samples its pre-commit (prior) value,
  // since `hold` commits at the moment boundary.
  return b.at(b.updates, (old) => old).hold(init);
}

/** A state that suppresses updates equal to the current value (default `Object.is`).
 * (Named `distinctB` before 1.0 — the Behavior-era name.) */
export function dedupe<A>(
  b: State<A>,
  eq: (x: A, y: A) => boolean = Object.is,
): State<A> {
  const out = new Stream<A>(b.updates.rank + 1);
  let prev = b.sampleNoTrans();
  b.updates.listen_(out, (t, a) => {
    if (!eq(prev, a)) {
      prev = a;
      out.send_(t, a);
    }
  });
  return new State<A>(() => b.sampleNoTrans(), out);
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
  trigger: Stream<A>,
  fetcher: (arg: A) => Promise<T>,
): State<Async<T>> {
  const requests = trigger.accumE({ seq: 0, arg: null as A }, (arg, prev) => ({
    seq: prev.seq + 1,
    arg,
  }));

  const latest = requests.map((r) => r.seq).hold(0);

  // Stamp BOTH outcomes with the request's seq: a rejection carries its seq
  // too, so a late failure of a superseded request can be dropped exactly like
  // a late success. `run` resolves on both paths, so perform's own Result is
  // always ok and the real outcome lives inside res.value.
  const responses = perform(requests, (r) =>
    fetcher(r.arg).then(
      (value) => ({ seq: r.seq, ok: true as const, value }),
      (error: unknown) => ({ seq: r.seq, ok: false as const, error }),
    ),
  );

  const settled = latest
    .at(responses, (latestSeq, res): Async<T> | null => {
      // res.ok is always true here (run never rejects); guard for types.
      if (!res.ok) return { status: "error", error: res.error };
      const r = res.value;
      if (r.seq !== latestSeq) return null; // superseded — ignore (win OR lose)
      return r.ok
        ? { status: "ok", value: r.value }
        : { status: "error", error: r.error };
    })
    .filter((s) => s !== null) as Stream<Async<T>>;

  const loading = requests.mapTo<Async<T>>({ status: "loading" });

  // loading (request moment) and settled (later moment) never coincide.
  return loading.or(settled).hold({ status: "idle" });
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
  b: State<T>,
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
