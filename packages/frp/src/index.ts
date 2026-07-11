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

  // The moment's pure zone: a source's send chain is executing (linear
  // chains propagate synchronously) or the heap is draining (join nodes).
  // User code running then is a combinator callback — a `fire` from there
  // is a side effect in the pure zone; sources check this and throw. The
  // batching body between sends and the post phase (current === null) are
  // unaffected.
  /** @internal */
  sending = 0;
  private draining = false;
  /** @internal */
  get pureZone(): boolean {
    return this.sending > 0 || this.draining;
  }

  private drainPrioritizedAndLast(): void {
    this.draining = true;
    try {
      this.drainLoop();
    } finally {
      this.draining = false;
    }
  }

  private drainLoop(): void {
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
// Stream<A> — discrete occurrences (push).
// ---------------------------------------------------------------------------

// Reap stateful behaviors: a hold that became unreachable can never be
// sampled again — its missed occurrences are unobservable, so detaching it
// from the source is invisible. Guarded at fire time: an updates stream
// still observed WITHOUT its wrapper (listeners or downstream nodes) is
// left alone. No-op on runtimes without FinalizationRegistry.
const REAPER =
  typeof FinalizationRegistry === "undefined"
    ? null
    : new FinalizationRegistry<() => void>((reap) => reap());

// Built at TOP LEVEL on purpose: closures share their defining scope's
// context in V8, so a reap callback created inside `hold` would drag the
// whole activation (including a strong `updates`) into the registry and
// pin its own target. Here the context is exactly {w}.
function reapVia(w: WeakRef<Stream<any>>): () => void {
  return () => {
    const u = w.deref();
    if (u && u.unobserved()) u.dispose();
  };
}

// The in-flight wake wave (see Stream.wake): non-null while a wake loop
// drains, so nested wakes enqueue instead of recursing.
let wakeQueue: Stream<any>[] | null = null;

// A rank beyond any realistic static graph depth. Reaching it means the live
// topology is cyclic through time (see the error in `ensureBiggerThan`).
const RANK_LIMIT = 1 << 16;

/**
 * Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
 * one occurrence per moment — simultaneous inputs coalesce (see `merge`).
 */
export class Stream<A> {
  /** @internal Topological height in the graph (propagation order). */
  rank: number;
  // A Set keeps unlisten O(1) — mass teardown of thousands of bindings on
  // one source used to be O(n²) with indexOf+splice. Insertion order is
  // preserved (observers stay FIFO). Every subscription passes a fresh
  // closure, so Set's dedup never bites.
  private listeners = new Set<Handler<A>>();
  /** Cached delivery snapshot of `listeners`; invalidated on mutation. */
  private snap: Handler<A>[] | null = null;
  /**
   * Downstream nodes, used to keep ranks topologically sorted. Refcounted:
   * an entry is dropped when its last subscription unlistens, so a
   * long-lived source doesn't accumulate dead targets across churn.
   */
  private targets = new Map<Stream<any>, number>();
  /** Teardown handles for this node's own subscriptions to its inputs. */
  private cleanups: Array<() => void> = [];
  /**
   * Recipe inputs of a demand-activated (pure) node: subscribed on the
   * first listener, torn down after the last one. Stateful nodes
   * (hold/accum/once/distinct/switch) use `consume` instead — their value
   * depends on the full history and must not miss occurrences.
   */
  private srcs: Array<{ i: Stream<any>; h: Handler<any> }> | null = null;
  /** Live unlistens while awake; null while asleep. */
  private live: Unlisten[] | null = null;
  /** @internal Reseed hook run on wake, before inputs attach (lift caches). */
  onWake: (() => void) | null = null;
  /** True once `dispose()` has run. */
  disposed = false;
  /** Exempt from the listener-count cascade (see `retain`). */
  private pinned = false;

  constructor(rank = 0) {
    this.rank = rank;
  }

  /**
   * @internal Raise this node's rank above `limit` and propagate the bump
   * downstream, so a node never has a rank ≤ one of its inputs. Detects
   * dependency cycles.
   *
   * Iterative on an explicit stack: a bump cascades through the entire
   * downstream chain, and a deep chain must not overflow the call stack.
   * `onPath` mirrors the recursion's path-tracking: a node met twice on ONE
   * dfs path is a cycle; met again on a sibling path (a diamond) it is
   * either already high enough (fast path) or bumped once more — same as
   * the recursive formulation.
   */
  ensureBiggerThan(limit: number): void {
    if (this.rank > limit) return; // fast path: nothing to bump, no allocs
    // A frame is revisited (its node already on the path) exactly when all
    // its children have been processed — LIFO order guarantees no other
    // frame for the same node can be alive in between. Cycles are caught at
    // push time: a *child* already on the path closes a loop.
    const stack: Array<{ n: Stream<any>; l: number }> = [{ n: this, l: limit }];
    const onPath = new Set<Stream<any>>();
    while (stack.length > 0) {
      const { n, l } = stack[stack.length - 1];
      if (onPath.has(n)) {
        // second visit: children done — leave the path
        onPath.delete(n);
        stack.pop();
        continue;
      }
      if (n.rank > l) {
        stack.pop();
        continue;
      }
      if (l + 1 > RANK_LIMIT) {
        // Only a topology that is cyclic THROUGH TIME (a switch re-pointed at
        // chains derived from its own output) can push ranks this far — no
        // rank assignment stays bounded there, so fail loudly instead of
        // silently degrading forever.
        throw new Error(
          "Continuum: rank overflow — a switch appears to be re-pointed at " +
            "chains derived from its own output (a temporal dependency " +
            "cycle). Break the loop with hold/snapshot (a pull edge) instead " +
            "of a push edge.",
        );
      }
      onPath.add(n);
      n.rank = l + 1;
      for (const t of n.targets.keys()) {
        if (onPath.has(t))
          throw new Error("Continuum: dependency cycle detected");
        stack.push({ n: t, l: n.rank });
      }
    }
  }

  /** @internal Register an in-graph subscriber. Returns an unsubscribe handle. */
  listen_(target: Stream<any> | null, h: Handler<A>): Unlisten {
    if (this.disposed) {
      // The only paths to `disposed` are an explicit dispose() and the
      // reaper (an unreachable stateful behavior) — say so.
      throw new Error(
        "Continuum: this node was disposed — by an explicit dispose() or " +
          "reaped after its behavior became unreachable — and cannot be " +
          "re-subscribed. Create derivations inside the scope that uses " +
          "them.",
      );
    }
    this.listeners.add(h);
    this.snap = null;
    if (this.listeners.size === 1) this.wake();
    if (target) {
      this.targets.set(target, (this.targets.get(target) ?? 0) + 1);
      // keep the target strictly above this source (handles dynamic
      // subscriptions from switchB/switchE onto deeper events).
      target.ensureBiggerThan(this.rank);
    }
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.listeners.delete(h);
      this.snap = null;
      if (target) {
        const n = this.targets.get(target);
        if (n !== undefined) {
          if (n <= 1) this.targets.delete(target);
          else this.targets.set(target, n - 1);
        }
      }
      this.sleep(); // no-op unless a lazy node just lost its last listener
    };
  }

  /** @internal Push an occurrence to every current subscriber. */
  send_(t: Transaction, a: A): void {
    // Delivery iterates a snapshot: a listener added during delivery must
    // NOT see this occurrence, one removed during delivery still does (see
    // the bookkeeping tests). The snapshot is CACHED between mutations —
    // fan-out sources fire far more often than they churn listeners, so
    // steady-state delivery allocates nothing.
    const ls = (this.snap ??= [...this.listeners]);
    for (const h of ls) h(t, a);
  }

  /** @internal True when nothing observes this node (no listeners, no downstream). */
  unobserved(): boolean {
    return this.listeners.size === 0 && this.targets.size === 0;
  }

  /** @internal Register a lazy input (see `srcs`). */
  source<X>(input: Stream<X>, h: Handler<X>): void {
    (this.srcs ??= []).push({ i: input, h });
    if (this.live) this.live.push(input.listen_(this, h));
  }

  private wake(): void {
    if (this.live || !this.srcs) return;
    // Iterative wave: listen_ re-enters wake for each colder input, and a
    // cold chain can be arbitrarily deep — the module-level queue flattens
    // the recursion (same reasoning as the iterative ensureBiggerThan).
    if (wakeQueue) {
      wakeQueue.push(this);
      return;
    }
    wakeQueue = [this];
    try {
      while (wakeQueue.length > 0) {
        const n = wakeQueue.pop()!;
        if (n.live || !n.srcs) continue;
        if (n.onWake) {
          // Reseed from COMMITTED values. A wake inside a moment (a switch
          // rewire runs in the last phase) may precede pending hold
          // commits — scheduling the reseed as a fresh `last` batch runs
          // it after every commit of this moment, and still before any
          // observer can open the next one.
          const t = Transaction.current;
          if (t) t.last(n.onWake);
          else n.onWake();
        }
        n.live = []; // set before attaching: source() during wake appends
        for (const s of n.srcs) n.live.push(s.i.listen_(n, s.h));
      }
    } finally {
      wakeQueue = null;
    }
  }

  private sleep(): void {
    if (!this.live || this.pinned || this.listeners.size > 0) return;
    const l = this.live;
    this.live = null;
    for (const un of l) un(); // inputs lose a listener -> they may sleep too
  }

  /**
   * @internal Subscribe this node to `input`, returning a teardown that also
   * cascades: if `input` is a derived node left with no listeners, it disposes
   * too. Sources (no cleanups of their own) are never auto-disposed.
   */
  subscribe<X>(input: Stream<X>, h: Handler<X>): Unlisten {
    const un = input.listen_(this, h);
    return () => {
      un();
      if (
        !input.pinned &&
        input.listeners.size === 0 &&
        input.cleanups.length > 0
      ) {
        input.dispose();
      }
    };
  }

  /** @internal Subscribe to `input` and register the teardown for `dispose()`. */
  consume<X>(input: Stream<X>, h: Handler<X>): void {
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
    if (this.live) {
      for (const un of this.live) un();
      this.live = null;
    }
    this.srcs = null;
    const cs = this.cleanups;
    this.cleanups = [];
    for (const c of cs) c();
    this.listeners.clear();
    this.snap = null;
    this.targets.clear();
  }

  // --- combinators -------------------------------------------------------

  map<B>(f: (a: A) => B): Stream<B> {
    const out = new Stream<B>(this.rank + 1);
    out.source(this, (t, a) => out.send_(t, f(a)));
    return out;
  }

  mapTo<B>(b: B): Stream<B> {
    return this.map(() => b);
  }

  filter(pred: (a: A) => boolean): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
    out.source(this, (t, a) => {
      if (pred(a)) out.send_(t, a);
    });
    return out;
  }

  /** Sample a behavior at the instant of each occurrence (sees pre-moment value). */
  snapshot<B, C>(b: Behavior<B>, f: (a: A, b: B) => C): Stream<C> {
    const out = new Stream<C>(this.rank + 1);
    out.source(this, (t, a) => out.send_(t, f(a, b.sampleNoTrans())));
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
    const updates = new Stream<A>(this.rank + 1);
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
    const b = new Behavior<A>(() => value, updates);
    // The wrapper is the liveness sentinel: while anybody can sample it, it
    // is reachable; once collected, the chain may be torn down (unless the
    // updates stream is independently observed). The held closure must
    // reach `updates` WEAKLY: dom code captures behavior wrappers inside
    // downstream handlers, so a strong path here could reach the target
    // itself — an entry whose held value pins its own target never fires.
    // Two outcomes at reap time: the island died wholesale (deref fails,
    // nothing to do) or a live source still feeds it (deref succeeds,
    // detach).
    REAPER?.register(b, reapVia(new WeakRef(updates)));
    return b;
  }

  /** Fold occurrences into a stream of accumulated states. */
  accumE<B>(init: B, f: (a: A, acc: B) => B): Stream<B> {
    const out = new Stream<B>(this.rank + 1);
    // The accumulator is staged like `hold` (commits at the moment's
    // boundary, so same-moment readers still see the past) — a plain cell,
    // not an internal hold: a hidden self-listener would keep the chain
    // hostage and defeat the reaper's cascade.
    let value = init;
    let stagedTx: Transaction | null = null;
    let staged: B;
    out.consume(this, (t, a) => {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(() => {
          if (stagedTx === t) {
            value = staged;
            stagedTx = null;
          }
        });
      }
      staged = f(a, value); // folds over the committed (pre-moment) state
      out.send_(t, staged);
    });
    return out;
  }

  /** Fold occurrences into a behavior. */
  accum<B>(init: B, f: (a: A, acc: B) => B): Behavior<B> {
    return this.accumE(init, f).hold(init);
  }

  /** Only the first occurrence passes. */
  once(): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
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
  gate(b: Behavior<boolean>): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
    out.source(this, (t, a) => {
      if (b.sampleNoTrans()) out.send_(t, a);
    });
    return out;
  }

  /** Left-biased merge: on simultaneous occurrences the left wins. */
  orElse(other: Stream<A>): Stream<A> {
    return Stream.merge(this, other, (l) => l);
  }

  /** Merge two events; simultaneous occurrences coalesce once via `combine`. */
  static merge<A>(
    ea: Stream<A>,
    eb: Stream<A>,
    combine: (l: A, r: A) => A,
  ): Stream<A> {
    const rank = Math.max(ea.rank, eb.rank) + 1;
    const out = new Stream<A>(rank);
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
    const un = this.listen_(null, (t, a) => t.post(() => h(a)));
    return () => {
      un();
      // Mirror the in-graph cascade (see `subscribe`): a derived node left
      // with no listeners detaches from its inputs, so long-lived sources
      // don't accumulate dead chains — every `{b.map(f)}` binding on a
      // behavior that outlives its component would otherwise leak. Sources
      // (no cleanups of their own) are never auto-disposed.
      if (
        !this.pinned &&
        this.listeners.size === 0 &&
        this.cleanups.length > 0
      ) {
        this.dispose();
      }
    };
  }

  /**
   * Keep this node alive when its last listener unsubscribes. Derived nodes
   * normally auto-dispose at that point (so per-component derivations don't
   * leak onto long-lived sources); call `retain()` on a derivation you
   * intentionally share across mounts (e.g. a module-level one).
   */
  retain(): this {
    this.pinned = true;
    return this;
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
    public updates: Stream<A>,
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
    // Register BEFORE the initial delivery: if `h` fires a transaction while
    // handling the initial value (e.g. an error boundary flipping its state
    // during the first render), that update must not be lost.
    const un = this.updates.listen(h);
    try {
      // Initial delivery is a pure read; sample directly instead of opening
      // a fresh transaction per listener (hot path with many bindings).
      h(this.sampleNoTrans());
    } catch (err) {
      un(); // don't leak the subscription if the initial delivery throws
      throw err;
    }
    return un;
  }

  /** Detach this behavior's `updates` from the graph (see `Stream.dispose`). */
  dispose(): void {
    this.updates.dispose();
  }

  /** Keep this behavior's update chain alive across listener churn (see `Stream.retain`). */
  retain(): this {
    this.updates.retain();
    return this;
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
    const out = new Stream<C>(rank);
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
    out.source(ba.updates, (t, a) => {
      va = a;
      schedule(t);
    });
    out.source(bb.updates, (t, b) => {
      vb = b;
      schedule(t);
    });
    // While asleep the caches go stale — reseed from the live values the
    // instant the node wakes (also cures joins over continuous behaviors
    // frozen at construction time).
    out.onWake = () => {
      va = ba.sampleNoTrans();
      vb = bb.sampleNoTrans();
      scheduledTx = null;
    };
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
    return new Behavior<A>(poll, new Stream<A>(0));
  }

  /** Follow the behavior currently selected by an outer behavior. */
  static switchB<A>(bb: Behavior<Behavior<A>>): Behavior<A> {
    let current = bb.sampleNoTrans();
    const out = new Stream<A>(current.updates.rank + 1);
    let innerUn = out.subscribe(current.updates, (t, a) => out.send_(t, a));
    out.consume(bb.updates, (t, nb) => {
      // Emit the new inner's current value as this behavior's update.
      out.send_(t, nb.sampleNoTrans());
      // Rewire at the moment boundary (classic switch delay).
      t.last(() => {
        innerUn();
        current = nb;
        // Rebase: after leaving a deep inner, come back down to the live
        // topology. Lowering is safe — downstream nodes stayed strictly
        // above the old (larger) rank, and the floor keeps `out` above
        // both of its live inputs.
        const floor = Math.max(bb.updates.rank, current.updates.rank) + 1;
        if (floor < out.rank) out.rank = floor;
        innerUn = out.subscribe(current.updates, (t2, a) => out.send_(t2, a));
      });
    });
    out.onDispose(() => innerUn());
    const b = new Behavior<A>(() => bb.sampleNoTrans().sampleNoTrans(), out);
    REAPER?.register(b, reapVia(new WeakRef(out)));
    return b;
  }

  /** Follow the event currently selected by a behavior. */
  static switchE<A>(be: Behavior<Stream<A>>): Stream<A> {
    let current = be.sampleNoTrans();
    const out = new Stream<A>(current.rank + 1);
    let innerUn = out.subscribe(current, (t, a) => out.send_(t, a));
    out.consume(be.updates, (t, ne) => {
      // Rewire at the moment boundary so the old event stays live this moment.
      t.last(() => {
        innerUn();
        current = ne;
        // Rebase to the live topology (see switchB for the safety argument).
        const floor = Math.max(be.updates.rank, current.rank) + 1;
        if (floor < out.rank) out.rank = floor;
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

// Build a `fire` for a source. `once` enforces the model at the boundary: a
// Stream carries at most ONE occurrence per moment, and a second fire of the
// same source inside one moment (reachable via `batch`) would silently
// corrupt folds — `accum` would fold the second occurrence over the
// PRE-moment state, dropping the first. Behaviors opt out: `hold` stages
// last-write-wins by design, so repeated `set` in a moment is legal.
function makeFire<A>(e: Stream<A>, once: boolean): (a: A) => void {
  let lastTx: Transaction | null = null;
  return (a: A) => {
    if (Transaction.current?.pureZone) {
      throw new Error(
        "Source fired inside a pure combinator (map/filter/snapshot/accum). " +
          "Keep those callbacks pure — fire from a handler, `listen`, or `perform`.",
      );
    }
    Transaction.run((t) => {
      if (once) {
        if (lastTx === t)
          throw new Error(
            "Continuum: a source may fire once per moment — merge distinct " +
              "streams with an explicit combine, or use a behavior's setter " +
              "for last-write-wins.",
          );
        lastTx = t;
      }
      t.sending++;
      try {
        e.send_(t, a);
      } finally {
        t.sending--;
      }
    });
  };
}

/** A source event plus its `fire`. Each `fire` opens a fresh moment. */
export function newStream<A>(): [Stream<A>, (a: A) => void] {
  const e = new Stream<A>(0);
  return [e, makeFire(e, true)];
}

/**
 * A source behavior (a `hold` over a source event) plus its setter.
 *
 * Setting a value equal to the current one (by `eq`, default `Object.is`)
 * is a no-op: no moment opens, no subscriber wakes. A behavior is a value
 * across time — "changing" it to the same value is not a change. Pass a
 * custom `eq` for structural comparison, or `() => false` to deliver every
 * set (then de-duplicate downstream with `distinctB` where needed).
 */
export function newBehavior<A>(
  init: A,
  eq: (prev: A, next: A) => boolean = Object.is,
): [Behavior<A>, (a: A) => void] {
  const e = new Stream<A>(0);
  // once=false: repeated `set` within one moment is last-write-wins (hold
  // stages exactly that), unlike a stream's fire.
  const fire = makeFire(e, false);
  // A source construct: the internal hold must survive listener churn
  // (bindings come and go with mounts) — exempt it from the cascade.
  const b = e.hold(init).retain();
  // Skip against the last SENT value, not the hold's committed one: inside
  // a batch the hold still shows the pre-moment value, and comparing with
  // it would wrongly swallow a set back to that value (4 → 5 → 4 in one
  // moment must commit 4).
  let current = init;
  const set = (a: A) => {
    if (eq(current, a)) return;
    fire(a);
    current = a; // after the fire: an aborted moment must not poison the skip
  };
  return [b, set];
}

/**
 * Run several fires as ONE moment. Every `fire`/`set` inside the callback
 * joins the same transaction: downstream combinators recompute once,
 * coalescing applies, and observers run once after the moment closes.
 * Nested `batch` calls join the enclosing moment. Returns the callback's
 * value.
 */
export function batch<A>(f: () => A): A {
  return Transaction.run(() => f());
}

/** The behavior that is `v` at every moment (applicative `pure`). */
export function constant<A>(v: A): Behavior<A> {
  return new Behavior<A>(() => v, new Stream<A>(0));
}

/** The event with no occurrences (identity of `merge`). */
export function never<A>(): Stream<A> {
  return new Stream<A>(0);
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
  e: Stream<A>,
  eq: (a: A, b: A) => boolean = Object.is,
): Stream<A> {
  const out = new Stream<A>(e.rank + 1);
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
  e: Stream<A>,
  run: (a: A) => Promise<B>,
): Stream<Result<unknown, B>> {
  const [out, fire] = newStream<Result<unknown, B>>();
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

// ---------------------------------------------------------------------------
// Deprecated aliases (the Sodium rename: an "event" reads as ONE occurrence,
// this type is the whole stream of them — and it collided with DOM's Event).
// Removed in 1.0.
// ---------------------------------------------------------------------------

/** @deprecated Renamed to `Stream` — same class, new name. Removed in 1.0. */
export const Event = Stream;
/** @deprecated Renamed to `Stream`. Removed in 1.0. */
export type Event<A> = Stream<A>;
/** @deprecated Renamed to `newStream`. Removed in 1.0. */
export const newEvent = newStream;
