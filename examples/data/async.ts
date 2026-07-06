// Reusable async patterns for real-world apps, built purely on the frp core.
// Nothing here is Continuum-specific magic — it's ordinary combinator code you
// could keep in your own project.

import { Event, Behavior, perform } from "@continuum/frp";
import { newEvent } from "@continuum/frp";

/** The lifecycle of an asynchronous request as first-class data. */
export type Async<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; value: T }
  | { status: "error"; error: unknown };

/**
 * Turn a stream of requests into a behavior tracking the async lifecycle.
 *
 * Each request flips the state to `loading`; when its promise settles the state
 * becomes `ok`/`error`. Requests are stamped with a sequence number so a slow
 * response to a superseded request is ignored (last-request-wins) — the classic
 * out-of-order-response bug, solved declaratively.
 *
 * The `perform` combinator is the IO boundary (§6.5): the effect runs after the
 * moment closes and its result re-enters the network as a fresh occurrence,
 * with failures reified into a `Result` rather than thrown.
 */
export function resource<A, T>(
  trigger: Event<A>,
  fetcher: (arg: A) => Promise<T>
): Behavior<Async<T>> {
  // Stamp each request with a monotonically increasing sequence number.
  const requests = trigger.accumE({ seq: 0, arg: null as A }, (arg, prev) => ({
    seq: prev.seq + 1,
    arg,
  }));

  // The sequence number of the most recently issued request.
  const latest = requests.map((r) => r.seq).hold(0);

  // Run the effect and carry the request's seq alongside the successful value.
  const responses = perform(requests, (r) =>
    fetcher(r.arg).then((value) => ({ seq: r.seq, value }))
  );

  // Settled responses → Async state, dropping stale successes.
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

  // loading (request moment) and settled (later moment) never coincide, so a
  // left-biased merge is unambiguous.
  return loading.orElse(settled).hold({ status: "idle" });
}

/**
 * Debounce an event: only emit after `ms` of quiet, coalescing a burst into its
 * last value. Uses `listen` (phase post) as the boundary to the timer, and
 * tears the timer down on dispose.
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
