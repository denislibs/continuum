// Continuum — FRP core (frp).
// Classic FRP (Wires + Streams), discrete branch (Sodium style):
// transactions, rank-ordered propagation, `hold` delay at the moment boundary.
//
// The two laws (FRP-MODEL §12): values are formulas (demand-driven, sleep
// without listeners); state and effects belong to a Scope (lifetime declared
// in code, not guessed by the engine).

/** Handle returned by `listen`: call it to unsubscribe. */
export type Unlisten = () => void;

// A subscriber inside the graph: receives the enclosing transaction + value.
type Handler<A> = (t: Transaction, a: A) => void;

// ---------------------------------------------------------------------------
// Scope — ownership for state and effects.
// ---------------------------------------------------------------------------

/**
 * An owner for state and effects. Everything registered in a scope is torn
 * down when it disposes: children first (reverse creation order), then this
 * scope's own cleanups (also reverse). Stateful derivations (`hold`,
 * `accum`) and effects (`perform`) attach to the ambient scope; the dom
 * package builds its component owners on top of this class, so inside a
 * component everything just works.
 */
export class Scope {
  /** @internal Teardowns to run on dispose (reverse order). */
  cleanups: Array<() => void> = [];
  /** @internal Child scopes (disposed before this one, reverse order). */
  children: Scope[] = [];
  /** @internal */
  parent: Scope | null;
  /** True once `dispose()` has run. */
  disposed = false;

  /** Attach to `parent`; defaults to the ambient scope. */
  constructor(parent: Scope | null = currentScope) {
    this.parent = parent;
    if (parent) parent.children.push(this);
  }

  /** Register a teardown to run when this scope disposes. */
  onDispose(fn: () => void): void {
    this.cleanups.push(fn);
  }

  /** Tear down children, then own cleanups; detach from the parent. Idempotent. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].dispose();
    }
    this.children.length = 0;
    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      this.cleanups[i]();
    }
    this.cleanups.length = 0;
    if (this.parent) {
      const siblings = this.parent.children;
      const idx = siblings.indexOf(this);
      if (idx >= 0) siblings.splice(idx, 1);
      this.parent = null;
    }
  }
}

let currentScope: Scope | null = null;

/** The ambient scope, if any (set by `root`/`runInScope` and dom components). */
export function getScope(): Scope | null {
  return currentScope;
}

/** Run `fn` with `scope` as the ambient owner; restores the previous one. */
export function runInScope<T>(scope: Scope | null, fn: () => T): T {
  const prev = currentScope;
  currentScope = scope;
  try {
    return fn();
  } finally {
    currentScope = prev;
  }
}

/**
 * A root scope for state that outlives any component — module-level counters,
 * app-wide processes. `fn` receives the dispose handle; state declared inside
 * lives until it is called.
 */
export function root<T>(fn: (dispose: () => void) => T): T {
  const scope = new Scope(null);
  return runInScope(scope, () => fn(() => scope.dispose()));
}

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

// The scope every stateful derivation and effect must declare. Nothing in
// the engine guesses liveness anymore: formulas sleep by demand, state and
// effects die with their owner.
function requireScope(what: string, example: string): Scope {
  const s = getScope();
  if (!s) {
    throw new Error(
      `Continuum: ${what} creates state or an effect, and those need an ` +
        "owner. Build it inside a component (dom sets the scope for you), " +
        "or declare app-level state explicitly:\n" +
        `  const value = root(() => ${example});`,
    );
  }
  return s;
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
  /** @internal Extra teardown run on sleep/dispose (flatten's inner subscription). */
  onSleep: (() => void) | null = null;
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
      // The only path to `disposed` is an explicit dispose() — say so.
      throw new Error(
        "Continuum: this node was disposed — dispose() was called on it — " +
          "and cannot be re-subscribed. Create derivations inside the " +
          "scope that uses them.",
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
    this.onSleep?.();
  }

  /** @internal Subscribe this node to `input` (rank-tracked). */
  subscribe<X>(input: Stream<X>, h: Handler<X>): Unlisten {
    return input.listen_(this, h);
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
      this.onSleep?.();
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

  /**
   * @deprecated Use `wire.at(stream, (value, event) => …)` — same semantics,
   * data first. Removed in 1.0.
   */
  snapshot<B, C>(b: Wire<B>, f: (a: A, b: B) => C): Stream<C> {
    return b.at(this, (value, event: A) => f(event, value));
  }

  /**
   * Step function: hold the last occurrence, committing at the moment
   * boundary. State — so it needs an owner: the process that keeps the value
   * current is registered in the ambient scope and detaches when the scope
   * disposes (the wire then answers with its final value).
   */
  hold(init: A): Wire<A> {
    const scope = requireScope("hold()", "src.hold(init)");
    let value = init;
    // Staging is keyed by transaction identity, so an aborted (dropped)
    // moment leaves nothing to commit and never blocks a later moment.
    let stagedTx: Transaction | null = null;
    let stagedVal: A;
    const updates = new Stream<A>(this.rank + 1);
    const un = this.listen_(updates, (t, a) => {
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
    scope.onDispose(un);
    return new Wire<A>(() => value, updates);
  }

  /**
   * Fold occurrences into a stream of accumulated states. State — the fold
   * process belongs to the ambient scope (see `hold`).
   */
  accumE<B>(init: B, f: (a: A, acc: B) => B): Stream<B> {
    const scope = requireScope("accumE()", "src.accumE(init, f)");
    const out = new Stream<B>(this.rank + 1);
    // The accumulator is staged like `hold`: commits at the moment's
    // boundary, so same-moment readers still see the past.
    let value = init;
    let stagedTx: Transaction | null = null;
    let staged: B;
    const un = this.listen_(out, (t, a) => {
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
    scope.onDispose(un);
    return out;
  }

  /** Fold occurrences into a behavior. */
  accum<B>(init: B, f: (a: A, acc: B) => B): Wire<B> {
    return this.accumE(init, f).hold(init);
  }

  /**
   * Only the first occurrence passes. A formula: cold occurrences nobody
   * observed do not spend it; once it fired while warm, the flag persists
   * across sleep (an observed occurrence stays observed).
   */
  once(): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
    let fired = false;
    let stagedTx: Transaction | null = null;
    out.source(this, (t, a) => {
      if (fired || stagedTx === t) return;
      // spend the once at the boundary — an aborted moment leaves it armed
      stagedTx = t;
      t.last(() => {
        if (stagedTx === t) {
          fired = true;
          stagedTx = null;
        }
      });
      out.send_(t, a);
    });
    return out;
  }

  /** Pass occurrences only while the wire is true. */
  when(b: Wire<boolean>): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
    out.source(this, (t, a) => {
      if (b.sampleNoTrans()) out.send_(t, a);
    });
    return out;
  }

  /** @deprecated Renamed to `when` — same semantics. Removed in 1.0. */
  gate(b: Wire<boolean>): Stream<A> {
    return this.when(b);
  }

  /** Left-biased merge: on simultaneous occurrences the left wins. */
  or(other: Stream<A>): Stream<A> {
    return Stream.merge(this, other, (l) => l);
  }

  /** @deprecated Renamed to `or` — same semantics. Removed in 1.0. */
  orElse(other: Stream<A>): Stream<A> {
    return this.or(other);
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
    out.source(ea, (t, a) => {
      schedule(t);
      left = a;
      hasLeft = true;
    });
    out.source(eb, (t, a) => {
      schedule(t);
      right = a;
      hasRight = true;
    });
    return out;
  }

  /** Observer (phase post): fires after the moment closes, FIFO. */
  listen(h: (a: A) => void): Unlisten {
    // No dispose-cascade here (it used to guess liveness from listener
    // counts and guessed wrong): pure derivations sleep on their own, and
    // stateful ones live exactly as long as their owning scope.
    return this.listen_(null, (t, a) => t.post(() => h(a)));
  }

  /**
   * Performance hint: keep a pure derivation attached across listener churn
   * instead of sleeping and re-waking (useful for a hot shared chain whose
   * listeners come and go). Never required for correctness.
   */
  retain(): this {
    this.pinned = true;
    return this;
  }
}

// ---------------------------------------------------------------------------
// Wire<A> — a value across time (pull) + discrete `updates` (push).
// ---------------------------------------------------------------------------

/**
 * A value across time (pull) with discrete change notifications (push).
 * Denotationally `Time → A`: it always has a value — `sample()` never misses.
 */
export class Wire<A> {
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
  map<B>(f: (a: A) => B): Wire<B> {
    return new Wire<B>(() => f(this.sampleNoTrans()), this.updates.map(f));
  }

  /**
   * Sample this wire at each occurrence of `e`: `draft.at(submits)` is the
   * stream of the wire's values as of those moments (pre-moment, with exact
   * simultaneity semantics). An optional combiner receives `(value, event)`.
   */
  at<B>(e: Stream<B>): Stream<A>;
  at<B, C>(e: Stream<B>, f: (value: A, event: B) => C): Stream<C>;
  at<B, C>(e: Stream<B>, f?: (value: A, event: B) => C): Stream<A | C> {
    const out = new Stream<A | C>(e.rank + 1);
    out.source(e, (t, b: B) =>
      out.send_(t, f ? f(this.sampleNoTrans(), b) : this.sampleNoTrans()),
    );
    return out;
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

  /** @deprecated Use `combine(bf, ba, (f, a) => f(a))`. Removed in 1.0. */
  static apply<A, B>(bf: Wire<(a: A) => B>, ba: Wire<A>): Wire<B> {
    return Wire.lift2((f, a) => f(a), bf, ba);
  }

  /**
   * @internal The two-input join every `combine` reduces to. Public under the
   * deprecated `lift2` name until 1.0 — prefer `combine(a, b, f)`.
   */
  static lift2<A, B, C>(
    f: (a: A, b: B) => C,
    ba: Wire<A>,
    bb: Wire<B>,
  ): Wire<C> {
    const rank = Math.max(ba.updates.rank, bb.updates.rank) + 1;
    const out = new Stream<C>(rank);
    // Committed caches + per-moment staging: the engine's own bookkeeping
    // obeys the boundary-commit discipline it imposes on user state (law 2)
    // — an aborted moment leaves the caches exactly as they were.
    let va = ba.sampleNoTrans();
    let vb = bb.sampleNoTrans();
    let stagedTx: Transaction | null = null;
    let sa: A;
    let sb: B;
    let hasSa = false;
    let hasSb = false;
    let scheduledTx: Transaction | null = null;
    let reseeding = false;
    let suppressed = false;
    const stage = (t: Transaction) => {
      if (stagedTx !== t) {
        stagedTx = t;
        hasSa = false;
        hasSb = false;
        t.last(() => {
          if (stagedTx === t) {
            if (hasSa) va = sa;
            if (hasSb) vb = sb;
            stagedTx = null;
            hasSa = false;
            hasSb = false;
          }
        });
      }
    };
    const flush = (t: Transaction) => {
      scheduledTx = null;
      if (reseeding) {
        // Woken mid-moment: the caches are not trustworthy until after the
        // commits — the deferred reseed emits once from fresh values.
        suppressed = true;
        return;
      }
      const a = stagedTx === t && hasSa ? sa : va;
      const b = stagedTx === t && hasSb ? sb : vb;
      out.send_(t, f(a, b));
    };
    const schedule = (t: Transaction) => {
      if (scheduledTx !== t) {
        scheduledTx = t;
        t.prioritized(out.rank, flush); // out.rank may have been bumped
      }
    };
    out.source(ba.updates, (t, a) => {
      stage(t);
      sa = a;
      hasSa = true;
      schedule(t);
    });
    out.source(bb.updates, (t, b) => {
      stage(t);
      sb = b;
      hasSb = true;
      schedule(t);
    });
    // While asleep the caches go stale — reseed on wake (also cures joins
    // over continuous behaviors frozen at construction time).
    out.onWake = () => {
      const t = Transaction.current;
      if (!t) {
        va = ba.sampleNoTrans();
        vb = bb.sampleNoTrans();
        scheduledTx = null;
        return;
      }
      // Waking mid-moment (a listen inside a batch, a switch rewire):
      // fresh values exist only after this moment's commits. A nested
      // `last` lands in the NEXT last batch — after every commit queued so
      // far — so the reseed reads committed values; any flush scheduled
      // meanwhile is suppressed and replaced by one emission from the
      // reseeded caches.
      reseeding = true;
      t.last(() =>
        t.last(() => {
          va = ba.sampleNoTrans();
          vb = bb.sampleNoTrans();
          stagedTx = null;
          hasSa = false;
          hasSb = false;
          reseeding = false;
          scheduledTx = null;
          if (suppressed) {
            suppressed = false;
            out.send_(t, f(va, vb));
          }
        }),
      );
    };
    return new Wire<C>(() => f(ba.sampleNoTrans(), bb.sampleNoTrans()), out);
  }

  /** @deprecated Use `combine(a, b, c, f)`. Removed in 1.0. */
  static lift3<A, B, C, D>(
    f: (a: A, b: B, c: C) => D,
    ba: Wire<A>,
    bb: Wire<B>,
    bc: Wire<C>,
  ): Wire<D> {
    const partial = Wire.lift2((a: A, b: B) => (c: C) => f(a, b, c), ba, bb);
    return Wire.lift2((g, c) => g(c), partial, bc);
  }

  /** Continuous behavior: sampled fresh on each read; no discrete updates. */
  static fromPoll<A>(poll: () => A): Wire<A> {
    return new Wire<A>(poll, new Stream<A>(0));
  }

  /**
   * @internal The wire-of-wires switch behind `flatten`. Public under the
   * deprecated `switchB` name until 1.0 — prefer `flatten(w)`.
   *
   * A formula: cold it is a recipe (pull samples straight through); waking
   * attaches the outer wire AND the currently selected inner; sleeping
   * detaches both. Rewiring while warm commits at the moment boundary.
   */
  static switchB<A>(bb: Wire<Wire<A>>): Wire<A> {
    const out = new Stream<A>(bb.updates.rank + 1);
    let innerUn: Unlisten | null = null;
    const attach = (b: Wire<A>) => {
      innerUn = out.subscribe(b.updates, (t, a) => out.send_(t, a));
    };
    out.source(bb.updates, (t, nb) => {
      // Emit the new inner's current value as this wire's update.
      out.send_(t, nb.sampleNoTrans());
      // Rewire at the moment boundary (classic switch delay).
      t.last(() => {
        if (!innerUn) return; // fell asleep before the boundary
        innerUn();
        // Rebase: after leaving a deep inner, come back down to the live
        // topology. Lowering is safe — downstream nodes stayed strictly
        // above the old (larger) rank, and the floor keeps `out` above
        // both of its live inputs.
        const floor = Math.max(bb.updates.rank, nb.updates.rank) + 1;
        if (floor < out.rank) out.rank = floor;
        attach(nb);
      });
    });
    out.onWake = () => attach(bb.sampleNoTrans());
    out.onSleep = () => {
      if (innerUn) {
        innerUn();
        innerUn = null;
      }
    };
    return new Wire<A>(() => bb.sampleNoTrans().sampleNoTrans(), out);
  }

  /**
   * @internal The wire-of-streams switch behind `flatten`. Public under the
   * deprecated `switchE` name until 1.0 — prefer `flatten(w)`.
   *
   * A formula (see switchB): waking attaches the CURRENT selection, even
   * one chosen while asleep.
   */
  static switchE<A>(be: Wire<Stream<A>>): Stream<A> {
    const out = new Stream<A>(be.updates.rank + 1);
    let innerUn: Unlisten | null = null;
    const attach = (e: Stream<A>) => {
      innerUn = out.subscribe(e, (t, a) => out.send_(t, a));
    };
    out.source(be.updates, (t, ne) => {
      // Rewire at the moment boundary so the old event stays live this moment.
      t.last(() => {
        if (!innerUn) return; // fell asleep before the boundary
        innerUn();
        // Rebase to the live topology (see switchB for the safety argument).
        const floor = Math.max(be.updates.rank, ne.rank) + 1;
        if (floor < out.rank) out.rank = floor;
        attach(ne);
      });
    });
    out.onWake = () => attach(be.sampleNoTrans());
    out.onSleep = () => {
      if (innerUn) {
        innerUn();
        innerUn = null;
      }
    };
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

// A source cell: a value committed at the moment boundary plus its updates
// stream, fused into one leaf node (no internal hold, no subscriptions of
// its own — a cell needs no owner). `stage` is the in-transaction writer
// used by processes (`wire().on()`); `set` is the public entry that opens a
// moment.
interface Cell<A> {
  w: Wire<A>;
  updates: Stream<A>;
  set: (a: A) => void;
  stage: (t: Transaction, a: A) => void;
  /** Staged value if this moment already wrote one, else the committed one. */
  pending: (t: Transaction) => A;
}

function makeCell<A>(init: A, eq: (prev: A, next: A) => boolean): Cell<A> {
  const updates = new Stream<A>(0);
  let value = init;
  let stagedTx: Transaction | null = null;
  let staged: A;
  const pending = (t: Transaction) => (stagedTx === t ? staged : value);
  const stage = (t: Transaction, a: A) => {
    if (stagedTx !== t) {
      stagedTx = t;
      t.last(() => {
        if (stagedTx === t) {
          value = staged;
          stagedTx = null;
        }
      });
    }
    staged = a; // last write wins within a moment
    updates.send_(t, a);
  };
  // Skip against the PENDING value: the staged one if this very moment
  // already wrote (4 → 5 → 4 in one batch must commit 4), else the
  // committed one. Staging dies with an aborted moment, so the skip can
  // never be poisoned by a throw (law 2) — no side variable to desync.
  const set = (a: A) => {
    const t0 = Transaction.current;
    if (eq(t0 && stagedTx === t0 ? staged : value, a)) return;
    if (t0?.pureZone) {
      throw new Error(
        "Source fired inside a pure combinator (map/filter/at/accum). " +
          "Keep those callbacks pure — fire from a handler, `listen`, or `perform`.",
      );
    }
    Transaction.run((t) => {
      t.sending++;
      try {
        stage(t, a);
      } finally {
        t.sending--;
      }
    });
  };
  return { w: new Wire<A>(() => value, updates), updates, set, stage, pending };
}

/**
 * A source behavior plus its setter.
 *
 * Setting a value equal to the current one (by `eq`, default `Object.is`)
 * is a no-op: no moment opens, no subscriber wakes. A wire is a value
 * across time — "changing" it to the same value is not a change. Pass a
 * custom `eq` for structural comparison, or `() => false` to deliver every
 * set.
 *
 * @deprecated Use `wire(init, eq?)` — the same cell as one value with
 * `.set` (and `.on` for declarative transitions). Removed in 1.0.
 */
export function newBehavior<A>(
  init: A,
  eq: (prev: A, next: A) => boolean = Object.is,
): [Wire<A>, (a: A) => void] {
  const c = makeCell(init, eq);
  return [c.w, c.set];
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

// ---------------------------------------------------------------------------
// The declarative surface (REFACTOR-PLAN phase 1): data first, names as
// intents. The theory-flavored forms above stay as deprecated aliases
// until 1.0.
// ---------------------------------------------------------------------------

/** A source wire: a cell you read like any wire and write via `.set`. */
export interface WireSource<A> extends Wire<A> {
  /** Set the current value; equal values (by the cell's `eq`) are a no-op. */
  set(a: A): void;
  /**
   * Declare a state transition: on each occurrence of `e`, fold the reducer
   * over the current value — `(state, event) => next`, `useReducer` order.
   * The occurrence and the wire's update share ONE moment (snapshot
   * semantics hold), and several `.on` sources firing simultaneously fold
   * sequentially. The transition process belongs to the ambient scope.
   */
  on<E>(e: Stream<E>, f: (state: A, event: E) => A): this;
}

/** A source stream: occurrences enter the network via `.fire`. */
export interface StreamSource<A> extends Stream<A> {
  /** Fire one occurrence; each fire outside `batch` opens a fresh moment. */
  fire(a: A): void;
}

/**
 * A source cell: the everyday way to create state. Reads like any wire
 * (`sample`, `map`, JSX binding), writes via `.set` — setting an equal value
 * (by `eq`, default `Object.is`) is a no-op.
 */
export function wire<A>(
  init: A,
  eq: (prev: A, next: A) => boolean = Object.is,
): WireSource<A> {
  const c = makeCell(init, eq);
  const on = <E>(e: Stream<E>, f: (state: A, event: E) => A) => {
    const scope = requireScope("wire(...).on(...)", "wire(0).on(e, f)");
    const un = e.listen_(c.updates, (t, ev) => {
      const next = f(c.pending(t), ev);
      if (eq(c.pending(t), next)) return;
      c.stage(t, next);
    });
    scope.onDispose(un);
    return src;
  };
  const src: WireSource<A> = Object.assign(c.w, { set: c.set, on });
  return src;
}

/** A source stream plus its `fire`, as one value. */
export function stream<A>(): StreamSource<A> {
  const [e, fire] = newStream<A>();
  return Object.assign(e, { fire });
}

/**
 * Combine wires pointwise — the join of the graph. Data first, the combiner
 * last; simultaneous updates coalesce into ONE recompute per moment
 * (glitch-free, see FRP-MODEL §3).
 */
export function combine<A, B, R>(
  a: Wire<A>,
  b: Wire<B>,
  f: (a: A, b: B) => R,
): Wire<R>;
export function combine<A, B, C, R>(
  a: Wire<A>,
  b: Wire<B>,
  c: Wire<C>,
  f: (a: A, b: B, c: C) => R,
): Wire<R>;
export function combine<A, B, C, D, R>(
  a: Wire<A>,
  b: Wire<B>,
  c: Wire<C>,
  d: Wire<D>,
  f: (a: A, b: B, c: C, d: D) => R,
): Wire<R>;
export function combine<A, B, C, D, E, R>(
  a: Wire<A>,
  b: Wire<B>,
  c: Wire<C>,
  d: Wire<D>,
  e: Wire<E>,
  f: (a: A, b: B, c: C, d: D, e: E) => R,
): Wire<R>;
export function combine(...args: unknown[]): Wire<unknown> {
  const f = args[args.length - 1] as (...xs: unknown[]) => unknown;
  const ws = args.slice(0, -1) as Array<Wire<unknown>>;
  if (ws.length === 2) return Wire.lift2(f, ws[0], ws[1]);
  // Wider joins fold through pair nodes; coalescing keeps it one recompute
  // per moment regardless of arity.
  let acc: Wire<unknown[]> = Wire.lift2((x, y) => [x, y], ws[0], ws[1]);
  for (let i = 2; i < ws.length; i++) {
    acc = Wire.lift2((xs, y) => [...(xs as unknown[]), y], acc, ws[i]);
  }
  return acc.map((xs) => f(...xs));
}

/**
 * Follow the wire (or stream) currently selected by an outer wire —
 * `Wire<Wire<A>> → Wire<A>` and `Wire<Stream<A>> → Stream<A>` under one
 * name. The switch commits at the moment boundary (see FRP-MODEL §6).
 */
export function flatten<A>(w: Wire<Wire<A>>): Wire<A>;
export function flatten<A>(w: Wire<Stream<A>>): Stream<A>;
export function flatten<A>(
  w: Wire<Wire<A>> | Wire<Stream<A>>,
): Wire<A> | Stream<A> {
  return w.sampleNoTrans() instanceof Wire
    ? Wire.switchB(w as Wire<Wire<A>>)
    : Wire.switchE(w as Wire<Stream<A>>);
}

/** The behavior that is `v` at every moment (applicative `pure`). */
export function constant<A>(v: A): Wire<A> {
  return new Wire<A>(() => v, new Stream<A>(0));
}

/** The event with no occurrences (identity of `merge`). */
export function never<A>(): Stream<A> {
  return new Stream<A>(0);
}

/** Continuous wall-clock behavior (milliseconds), sampled on demand. */
export function time(): Wire<number> {
  return Wire.fromPoll(() => Date.now());
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
  // The memory commits at the moment boundary (law 2: an aborted moment
  // must not prime the dedup) …
  let stagedTx: Transaction | null = null;
  let staged: A;
  out.source(e, (t, a) => {
    if (!hasPrev || !eq(prev, a)) {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(() => {
          if (stagedTx === t) {
            hasPrev = true;
            prev = staged;
            stagedTx = null;
          }
        });
      }
      staged = a;
      out.send_(t, a);
    }
  });
  // … and belongs to a warm period: occurrences nobody observed never
  // primed it, so a fresh period starts fresh.
  out.onWake = () => {
    hasPrev = false;
    stagedTx = null;
  };
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
  // An effect — so it needs an owner: the request subscription detaches with
  // the scope, and results that settle after the scope died are dropped.
  const scope = requireScope("perform()", "perform(requests, fetcher)");
  const [out, fire] = newStream<Result<unknown, B>>();
  let dead = false;
  // listen runs in phase post (after the moment closes); the promise
  // settles later, and `fire` opens a brand-new moment.
  const un = e.listen((a) => {
    run(a).then(
      (value) => {
        if (!dead) fire({ ok: true, value });
      },
      (error) => {
        if (!dead) fire({ ok: false, error });
      },
    );
  });
  scope.onDispose(() => {
    dead = true;
    un();
  });
  return out;
}

// ---------------------------------------------------------------------------
// Continuous-time combinators (§14 roadmap #7)
// ---------------------------------------------------------------------------

export { integral, derivative, warp } from "./continuous.js";

// ---------------------------------------------------------------------------
// Deprecated aliases. Two renames, same playbook, removed in 1.0:
//  - Event → Stream (an "event" reads as ONE occurrence, the type is the
//    whole stream of them — and it collided with DOM's Event);
//  - Behavior → Wire (theory jargon nobody outside FRP literature reads;
//    a wire is a live value you plug things into).
// ---------------------------------------------------------------------------

/** @deprecated Renamed to `Stream` — same class, new name. Removed in 1.0. */
export const Event = Stream;
/** @deprecated Renamed to `Stream`. Removed in 1.0. */
export type Event<A> = Stream<A>;
/** @deprecated Renamed to `newStream`. Removed in 1.0. */
export const newEvent = newStream;
/** @deprecated Renamed to `Wire` — same class, new name. Removed in 1.0. */
export const Behavior = Wire;
/** @deprecated Renamed to `Wire`. Removed in 1.0. */
export type Behavior<A> = Wire<A>;
