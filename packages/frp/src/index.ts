// Continuum — FRP core (frp).
// Classic FRP (Behaviors + Events), discrete branch (Sodium style):
// transactions, rank-ordered propagation, `hold` delay at the moment boundary.

/** Handle returned by `listen`: call it to unsubscribe. */
export type Unlisten = () => void;

// A subscriber inside the graph: receives the enclosing transaction + value.
type Handler<A> = (t: Transaction, a: A) => void;

// ---------------------------------------------------------------------------
// Transaction — one logical instant of time.
// ---------------------------------------------------------------------------

interface Entry {
  rank: number;
  seq: number;
  action: (t: Transaction) => void;
}

/**
 * One logical instant of time (a "moment"). Engine-level API: application
 * code normally never touches it — `fire`/`listen`/`sample` manage moments.
 */
export class Transaction {
  /** @internal */
  static current: Transaction | null = null;
  private static seqCounter = 0;

  // Binary min-heap over `prioritized`, keyed by (rank, seq).
  private heap: Entry[] = [];
  private lastQ: Array<() => void> = [];
  private postQ: Array<() => void> = [];

  // --- phase 1: prioritized work (rank order) ---
  prioritized(rank: number, action: (t: Transaction) => void): void {
    this.heapPush({ rank, seq: Transaction.seqCounter++, action });
  }

  // --- phase 2: end-of-moment commits (hold, switch) ---
  last(action: () => void): void {
    this.lastQ.push(action);
  }

  // --- phase 3: observer side effects, run after the moment closes ---
  post(action: () => void): void {
    this.postQ.push(action);
  }

  private heapPush(e: Entry): void {
    const h = this.heap;
    h.push(e);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.less(h[i], h[p])) {
        [h[i], h[p]] = [h[p], h[i]];
        i = p;
      } else break;
    }
  }

  private heapPop(): Entry | undefined {
    const h = this.heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop()!;
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      const n = h.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let m = i;
        if (l < n && this.less(h[l], h[m])) m = l;
        if (r < n && this.less(h[r], h[m])) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m], h[i]];
        i = m;
      }
    }
    return top;
  }

  private less(a: Entry, b: Entry): boolean {
    return a.rank < b.rank || (a.rank === b.rank && a.seq < b.seq);
  }

  private drainPrioritizedAndLast(): void {
    for (;;) {
      let e = this.heapPop();
      while (e !== undefined) {
        e.action(this);
        e = this.heapPop();
      }
      if (this.lastQ.length === 0) break;
      const ls = this.lastQ;
      this.lastQ = [];
      for (const l of ls) l();
      // `last` may have scheduled fresh prioritized work — loop again.
    }
  }

  // Run `f` inside a transaction. Nested calls reuse the enclosing moment.
  static run<A>(f: (t: Transaction) => A): A {
    const existing = Transaction.current;
    if (existing) return f(existing);

    const t = new Transaction();
    Transaction.current = t;
    let result: A;
    try {
      result = f(t);
      t.drainPrioritizedAndLast();
    } finally {
      // Restore engine state even if a user function threw (§5.1).
      Transaction.current = null;
    }
    // phase 3: observers run after the moment has closed, so a `send`
    // from an observer opens a brand-new moment. Observers are isolated:
    // one throwing does not stop the rest; the first error is rethrown.
    const posts = t.postQ;
    t.postQ = [];
    let firstErr: unknown;
    let hasErr = false;
    for (const p of posts) {
      try {
        p();
      } catch (err) {
        if (!hasErr) {
          hasErr = true;
          firstErr = err;
        }
      }
    }
    if (hasErr) throw firstErr;
    return result;
  }
}

// ---------------------------------------------------------------------------
// Event<A> — discrete occurrences (push).
// ---------------------------------------------------------------------------

/**
 * Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
 * one occurrence per moment — simultaneous inputs coalesce (see `merge`).
 */
export class Event<A> {
  /** @internal Topological height in the graph (propagation order). */
  rank: number;
  private listeners: Handler<A>[] = [];
  /** Downstream nodes, used to keep ranks topologically sorted. */
  private targets = new Set<Event<any>>();
  /** Teardown handles for this node's own subscriptions to its inputs. */
  private cleanups: Array<() => void> = [];
  /** True once `dispose()` has run. */
  disposed = false;

  constructor(rank = 0) {
    this.rank = rank;
  }

  /**
   * @internal Raise this node's rank above `limit` and propagate the bump
   * downstream, so a node never has a rank ≤ one of its inputs. Detects
   * dependency cycles.
   */
  ensureBiggerThan(limit: number, visited: Set<Event<any>>): void {
    if (this.rank > limit) return;
    if (visited.has(this))
      throw new Error("Continuum: dependency cycle detected");
    visited.add(this);
    this.rank = limit + 1;
    for (const t of this.targets) t.ensureBiggerThan(this.rank, visited);
    visited.delete(this);
  }

  /** @internal Register an in-graph subscriber. Returns an unsubscribe handle. */
  listen_(target: Event<any> | null, h: Handler<A>): Unlisten {
    this.listeners.push(h);
    if (target) {
      this.targets.add(target);
      // keep the target strictly above this source (handles dynamic
      // subscriptions from switchB/switchE onto deeper events).
      target.ensureBiggerThan(this.rank, new Set());
    }
    return () => {
      const i = this.listeners.indexOf(h);
      if (i >= 0) this.listeners.splice(i, 1);
    };
  }

  /** @internal Push an occurrence to every current subscriber. */
  send_(t: Transaction, a: A): void {
    const ls = this.listeners.slice();
    for (const h of ls) h(t, a);
  }

  /**
   * @internal Subscribe this node to `input`, returning a teardown that also
   * cascades: if `input` is a derived node left with no listeners, it disposes
   * too. Sources (no cleanups of their own) are never auto-disposed.
   */
  subscribe<X>(input: Event<X>, h: Handler<X>): Unlisten {
    const un = input.listen_(this, h);
    return () => {
      un();
      if (input.listeners.length === 0 && input.cleanups.length > 0) {
        input.dispose();
      }
    };
  }

  /** @internal Subscribe to `input` and register the teardown for `dispose()`. */
  consume<X>(input: Event<X>, h: Handler<X>): void {
    this.cleanups.push(this.subscribe(input, h));
  }

  /** @internal Register an extra teardown to run on `dispose()`. */
  onDispose(fn: () => void): void {
    this.cleanups.push(fn);
  }

  /**
   * Detach this node from its inputs (breaking the push chain so it can be
   * collected) and drop its downstream links. Idempotent. Cascades upstream
   * through derived intermediates that become unused, but never to sources.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const cs = this.cleanups;
    this.cleanups = [];
    for (const c of cs) c();
    this.listeners.length = 0;
    this.targets.clear();
  }

  // --- combinators -------------------------------------------------------

  map<B>(f: (a: A) => B): Event<B> {
    const out = new Event<B>(this.rank + 1);
    out.consume(this, (t, a) => out.send_(t, f(a)));
    return out;
  }

  mapTo<B>(b: B): Event<B> {
    return this.map(() => b);
  }

  filter(pred: (a: A) => boolean): Event<A> {
    const out = new Event<A>(this.rank + 1);
    out.consume(this, (t, a) => {
      if (pred(a)) out.send_(t, a);
    });
    return out;
  }

  /** Sample a behavior at the instant of each occurrence (sees pre-moment value). */
  snapshot<B, C>(b: Behavior<B>, f: (a: A, b: B) => C): Event<C> {
    const out = new Event<C>(this.rank + 1);
    out.consume(this, (t, a) => out.send_(t, f(a, b.sampleNoTrans())));
    return out;
  }

  /** Step function: hold the last occurrence, committing at the moment boundary. */
  hold(init: A): Behavior<A> {
    const self = this;
    let value = init;
    // Staging is keyed by transaction identity, so an aborted (dropped)
    // moment leaves nothing to commit and never blocks a later moment.
    let stagedTx: Transaction | null = null;
    let stagedVal: A;
    const updates = new Event<A>(this.rank + 1);
    updates.consume(self, (t, a) => {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(() => {
          if (stagedTx === t) {
            value = stagedVal;
            stagedTx = null;
          }
        });
      }
      stagedVal = a; // last write wins within a moment
      updates.send_(t, a);
    });
    return new Behavior<A>(() => value, updates);
  }

  /** Fold occurrences into a stream of accumulated states. */
  accumE<B>(init: B, f: (a: A, acc: B) => B): Event<B> {
    const self = this;
    const out = new Event<B>(this.rank + 1);
    const acc = out.hold(init); // delayed: snapshot sees previous state
    out.consume(self, (t, a) => out.send_(t, f(a, acc.sampleNoTrans())));
    return out;
  }

  /** Fold occurrences into a behavior. */
  accum<B>(init: B, f: (a: A, acc: B) => B): Behavior<B> {
    return this.accumE(init, f).hold(init);
  }

  /** Only the first occurrence passes. */
  once(): Event<A> {
    const out = new Event<A>(this.rank + 1);
    let fired = false;
    const stop = out.subscribe(this, (t, a) => {
      if (fired) return;
      fired = true;
      out.send_(t, a);
      stop();
    });
    out.onDispose(stop);
    return out;
  }

  /** Pass occurrences only while the behavior is true. */
  gate(b: Behavior<boolean>): Event<A> {
    const out = new Event<A>(this.rank + 1);
    out.consume(this, (t, a) => {
      if (b.sampleNoTrans()) out.send_(t, a);
    });
    return out;
  }

  /** Left-biased merge: on simultaneous occurrences the left wins. */
  orElse(other: Event<A>): Event<A> {
    return Event.merge(this, other, (l) => l);
  }

  /** Merge two events; simultaneous occurrences coalesce once via `combine`. */
  static merge<A>(
    ea: Event<A>,
    eb: Event<A>,
    combine: (l: A, r: A) => A,
  ): Event<A> {
    const rank = Math.max(ea.rank, eb.rank) + 1;
    const out = new Event<A>(rank);
    let hasLeft = false;
    let hasRight = false;
    let left: A;
    let right: A;
    let scheduledTx: Transaction | null = null;
    const flush = (t: Transaction) => {
      scheduledTx = null;
      const val =
        hasLeft && hasRight ? combine(left, right) : hasLeft ? left : right;
      hasLeft = false;
      hasRight = false;
      out.send_(t, val);
    };
    const schedule = (t: Transaction) => {
      if (scheduledTx !== t) {
        // fresh moment: clear stale coalescing state, then prioritize
        scheduledTx = t;
        hasLeft = false;
        hasRight = false;
        t.prioritized(out.rank, flush); // out.rank may have been bumped
      }
    };
    out.consume(ea, (t, a) => {
      schedule(t);
      left = a;
      hasLeft = true;
    });
    out.consume(eb, (t, a) => {
      schedule(t);
      right = a;
      hasRight = true;
    });
    return out;
  }

  /** Observer (phase post): fires after the moment closes, FIFO. */
  listen(h: (a: A) => void): Unlisten {
    return this.listen_(null, (t, a) => t.post(() => h(a)));
  }
}

// ---------------------------------------------------------------------------
// Behavior<A> — a value across time (pull) + discrete `updates` (push).
// ---------------------------------------------------------------------------

/**
 * A value across time (pull) with discrete change notifications (push).
 * Denotationally `Time → A`: it always has a value — `sample()` never misses.
 */
export class Behavior<A> {
  constructor(
    /** Pull the current value without opening a transaction. */
    public sampleNoTrans: () => A,
    /** Push notifications of discrete changes (empty for continuous behaviors). */
    public updates: Event<A>,
  ) {}

  sample(): A {
    return Transaction.run(() => this.sampleNoTrans());
  }

  /** Pointwise transform (continuous-safe: recomputed on each sample). */
  map<B>(f: (a: A) => B): Behavior<B> {
    return new Behavior<B>(() => f(this.sampleNoTrans()), this.updates.map(f));
  }

  /** Deliver the current value immediately, then every change. */
  listen(h: (a: A) => void): Unlisten {
    // Initial delivery is a pure read; sample directly instead of opening a
    // fresh transaction per listener (hot path when building many bindings).
    h(this.sampleNoTrans());
    return this.updates.listen(h);
  }

  /** Detach this behavior's `updates` from the graph (see `Event.dispose`). */
  dispose(): void {
    this.updates.dispose();
  }

  // --- static combinators -----------------------------------------------

  /** Applicative with coalescing: apply a behavior-of-function to a value. */
  static apply<A, B>(bf: Behavior<(a: A) => B>, ba: Behavior<A>): Behavior<B> {
    return Behavior.lift2((f, a) => f(a), bf, ba);
  }

  /** Combine two behaviors pointwise; simultaneous updates coalesce once. */
  static lift2<A, B, C>(
    f: (a: A, b: B) => C,
    ba: Behavior<A>,
    bb: Behavior<B>,
  ): Behavior<C> {
    const rank = Math.max(ba.updates.rank, bb.updates.rank) + 1;
    const out = new Event<C>(rank);
    let va = ba.sampleNoTrans();
    let vb = bb.sampleNoTrans();
    let scheduledTx: Transaction | null = null;
    const flush = (t: Transaction) => {
      scheduledTx = null;
      out.send_(t, f(va, vb));
    };
    const schedule = (t: Transaction) => {
      if (scheduledTx !== t) {
        scheduledTx = t;
        t.prioritized(out.rank, flush); // out.rank may have been bumped
      }
    };
    out.consume(ba.updates, (t, a) => {
      va = a;
      schedule(t);
    });
    out.consume(bb.updates, (t, b) => {
      vb = b;
      schedule(t);
    });
    return new Behavior<C>(
      () => f(ba.sampleNoTrans(), bb.sampleNoTrans()),
      out,
    );
  }

  /** Combine three behaviors pointwise. */
  static lift3<A, B, C, D>(
    f: (a: A, b: B, c: C) => D,
    ba: Behavior<A>,
    bb: Behavior<B>,
    bc: Behavior<C>,
  ): Behavior<D> {
    const partial = Behavior.lift2(
      (a: A, b: B) => (c: C) => f(a, b, c),
      ba,
      bb,
    );
    return Behavior.lift2((g, c) => g(c), partial, bc);
  }

  /** Continuous behavior: sampled fresh on each read; no discrete updates. */
  static fromPoll<A>(poll: () => A): Behavior<A> {
    return new Behavior<A>(poll, new Event<A>(0));
  }

  /** Follow the behavior currently selected by an outer behavior. */
  static switchB<A>(bb: Behavior<Behavior<A>>): Behavior<A> {
    let current = bb.sampleNoTrans();
    const out = new Event<A>(current.updates.rank + 1);
    let innerUn = out.subscribe(current.updates, (t, a) => out.send_(t, a));
    out.consume(bb.updates, (t, nb) => {
      // Emit the new inner's current value as this behavior's update.
      out.send_(t, nb.sampleNoTrans());
      // Rewire at the moment boundary (classic switch delay).
      t.last(() => {
        innerUn();
        current = nb;
        innerUn = out.subscribe(current.updates, (t2, a) => out.send_(t2, a));
      });
    });
    out.onDispose(() => innerUn());
    return new Behavior<A>(() => bb.sampleNoTrans().sampleNoTrans(), out);
  }

  /** Follow the event currently selected by a behavior. */
  static switchE<A>(be: Behavior<Event<A>>): Event<A> {
    let current = be.sampleNoTrans();
    const out = new Event<A>(current.rank + 1);
    let innerUn = out.subscribe(current, (t, a) => out.send_(t, a));
    out.consume(be.updates, (t, ne) => {
      // Rewire at the moment boundary so the old event stays live this moment.
      t.last(() => {
        innerUn();
        current = ne;
        innerUn = out.subscribe(current, (t2, a) => out.send_(t2, a));
      });
    });
    out.onDispose(() => innerUn());
    return out;
  }
}

// ---------------------------------------------------------------------------
// Source constructors
// ---------------------------------------------------------------------------

/** A source event plus its `fire`. Each `fire` opens a fresh moment. */
export function newEvent<A>(): [Event<A>, (a: A) => void] {
  const e = new Event<A>(0);
  const fire = (a: A) => Transaction.run((t) => e.send_(t, a));
  return [e, fire];
}

/** A source behavior (a `hold` over a source event) plus its setter. */
export function newBehavior<A>(init: A): [Behavior<A>, (a: A) => void] {
  const [e, fire] = newEvent<A>();
  const b = e.hold(init);
  return [b, fire];
}

/** The behavior that is `v` at every moment (applicative `pure`). */
export function constant<A>(v: A): Behavior<A> {
  return new Behavior<A>(() => v, new Event<A>(0));
}

/** The event with no occurrences (identity of `merge`). */
export function never<A>(): Event<A> {
  return new Event<A>(0);
}

/** Continuous wall-clock behavior (milliseconds), sampled on demand. */
export function time(): Behavior<number> {
  return Behavior.fromPoll(() => Date.now());
}

// ---------------------------------------------------------------------------
// Effects & de-duplication (§6.5)
// ---------------------------------------------------------------------------

/** Outcome of an effect as data: errors flow through the graph, not thrown. */
export type Result<E, T> = { ok: true; value: T } | { ok: false; error: E };

/**
 * De-duplicate consecutive equal values (filter with one-value memory).
 * Default comparison is `Object.is`.
 */
export function distinct<A>(
  e: Event<A>,
  eq: (a: A, b: A) => boolean = Object.is,
): Event<A> {
  const out = new Event<A>(e.rank + 1);
  let hasPrev = false;
  let prev: A;
  out.consume(e, (t, a) => {
    if (!hasPrev || !eq(prev, a)) {
      hasPrev = true;
      prev = a;
      out.send_(t, a);
    }
  });
  return out;
}

/**
 * IO boundary: run an async effect per request occurrence and feed the
 * result back into the network as a fresh occurrence (new moment).
 * Errors are wrapped in a `Result` and flow as data.
 */
export function perform<A, B>(
  e: Event<A>,
  run: (a: A) => Promise<B>,
): Event<Result<unknown, B>> {
  const [out, fire] = newEvent<Result<unknown, B>>();
  // listen runs in phase post (after the moment closes); the promise
  // settles later, and `fire` opens a brand-new moment.
  out.onDispose(
    e.listen((a) => {
      run(a).then(
        (value) => fire({ ok: true, value }),
        (error) => fire({ ok: false, error }),
      );
    }),
  );
  return out;
}

// ---------------------------------------------------------------------------
// Continuous-time combinators (§14 roadmap #7)
// ---------------------------------------------------------------------------

export { integral, derivative, warp } from "./continuous.js";
