// Continuum — FRP core (frp).
// Classic FRP (States + Streams), discrete branch (Sodium style):
// transactions, rank-ordered propagation, `hold` delay at the moment boundary.
//
// The two laws (FRP-MODEL §12): values are formulas (demand-driven, sleep
// without listeners); state and effects belong to a Scope (lifetime declared
// in code, not guessed by the engine).

/** Handle returned by `listen`: call it to unsubscribe. */
export type Unlisten = () => void;

// A subscriber inside the graph: receives the enclosing transaction + value.
type Handler<A> = (t: Transaction, a: A) => void;

// A leaf observer (public `listen`): just the value, scheduled into the
// observer phase after the moment closes.
type Observer<A> = (a: A) => void;

// One graph edge: the handler, the receiving node (null for in-graph leaf
// subscribers — rank propagation walks `t`), and this edge's index in the
// source's `obs` array (kept current by swap-removal; -1 once removed). One
// small record replaces what used to be a Set entry + a refcounted Map
// entry + a closure. The discriminant for `h` is the target: an edge whose
// `t` is the POST sentinel holds an Observer, every other edge an in-graph
// Handler (see `send_`).
/** @internal Exposed to the dom renderer only as the opaque `ObserverHandle`. */
export interface Edge<A> {
  h: Handler<A> | Observer<A>;
  t: Stream<any> | null;
  i: number;
}

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
  /** @internal Teardowns to run on dispose (reverse order); lazy. */
  cleanups: Array<() => void> | null = null;
  /** @internal Child scopes (disposed first, reverse order); lazy. */
  children: Scope[] | null = null;
  /** @internal */
  parent: Scope | null;
  /** @internal Bit 1 — disposed; bit 2 belongs to subclasses (dom Owner's
   * `mounted`): two booleans in one slot. */
  flags = 0;

  /** True once `dispose()` has run. */
  get disposed(): boolean {
    return (this.flags & 1) !== 0;
  }

  /** Attach to `parent`; defaults to the ambient scope. */
  constructor(parent: Scope | null = currentScope) {
    this.parent = parent;
    if (parent) (parent.children ??= []).push(this);
  }

  /** Register a teardown to run when this scope disposes. */
  onDispose(fn: () => void): void {
    (this.cleanups ??= []).push(fn);
  }

  /** Tear down children, then own cleanups; detach from the parent. Idempotent. */
  dispose(): void {
    if ((this.flags & 1) !== 0) return;
    this.flags |= 1;
    if (this.children) {
      for (let i = this.children.length - 1; i >= 0; i--) {
        this.children[i].dispose();
      }
      this.children.length = 0;
    }
    if (this.cleanups) {
      for (let i = this.cleanups.length - 1; i >= 0; i--) {
        this.cleanups[i]();
      }
      this.cleanups.length = 0;
    }
    if (this.parent) {
      const siblings = this.parent.children;
      if (siblings) {
        const idx = siblings.indexOf(this);
        if (idx >= 0) siblings.splice(idx, 1);
      }
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
  private static idCounter = 0;

  /**
   * @internal Monotonic MOMENT id. The pool below recycles the object, so
   * object identity no longer distinguishes moments across time — anything
   * comparing a SAVED transaction against a later one (makeFire's
   * once-per-moment guard) must compare ids. In-moment staging keyed by
   * identity is fine: those keys reset at the boundary, and an aborted
   * moment's object is never recycled.
   */
  id = Transaction.idCounter++;

  // Binary min-heap over `prioritized`, keyed by (rank, seq) — but the
  // FIRST entry of a moment lives inline in three fields: most moments
  // schedule exactly one prioritized action (a lone `set`), and paying a
  // heap entry object + sift for it showed up in moment-throughput
  // profiles. The heap engages from the second entry on and is allocated
  // then — most moments never pay the array.
  private p1a: ((t: Transaction) => void) | null = null;
  private p1r = 0;
  private p1s = 0;
  private heap: Entry[] | null = null;
  // flat (fn, arg) pairs written by cursor into a REUSED array (the pool
  // below recycles the whole transaction): `push` + `length = 0` looks
  // cheaper, but resetting length is a V8 runtime call that dominated the
  // 500k-set profile. Consumed slots are cleared during the drain, so the
  // recycled arrays retain nothing.
  private lastQ: unknown[] = [];
  private lastIx = 0; // batch drain cursor
  private lastN = 0; // write cursor
  private postQ: unknown[] = [];
  private postN = 0;

  // --- phase 1: prioritized work (rank order) ---
  prioritized(rank: number, action: (t: Transaction) => void): void {
    const seq = Transaction.seqCounter++;
    if (this.p1a === null && (this.heap === null || this.heap.length === 0)) {
      this.p1a = action;
      this.p1r = rank;
      this.p1s = seq;
      return;
    }
    if (this.p1a !== null) {
      // spill the inline entry so heap ordering sees both
      this.heapPush({ rank: this.p1r, seq: this.p1s, action: this.p1a });
      this.p1a = null;
    }
    this.heapPush({ rank, seq, action });
  }

  // --- phase 2: end-of-moment commits (hold, switch) ---
  last(action: () => void): void;
  last<X>(action: (x: X) => void, arg: X): void;
  last(action: (x?: unknown) => void, arg?: unknown): void {
    const q = this.lastQ;
    q[this.lastN++] = action;
    q[this.lastN++] = arg;
  }

  // --- phase 3: observer side effects, run after the moment closes ---
  post<X>(fn: (x: X) => void, arg: X): void {
    const q = this.postQ;
    q[this.postN++] = fn;
    q[this.postN++] = arg;
  }

  private heapPush(e: Entry): void {
    const h = (this.heap ??= []);
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
    if (h === null || h.length === 0) return undefined;
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
      for (;;) {
        // the inline slot competes with the heap top by (rank, seq)
        const a = this.p1a;
        if (a !== null) {
          const h = this.heap;
          if (
            h === null ||
            h.length === 0 ||
            this.p1r < h[0].rank ||
            (this.p1r === h[0].rank && this.p1s < h[0].seq)
          ) {
            this.p1a = null;
            a(this);
            continue;
          }
        }
        const e = this.heapPop();
        if (e === undefined) break;
        e.action(this);
      }
      // One BATCH is the pairs queued so far; entries a batch enqueues run
      // in the next batch, after another prioritized pass — the cursor
      // replaces the old array swap (an allocation per batch).
      if (this.lastIx >= this.lastN) break;
      const q = this.lastQ;
      const batchEnd = this.lastN;
      for (let i = this.lastIx; i < batchEnd; i += 2) {
        const fn = q[i] as (x: unknown) => void;
        const arg = q[i + 1];
        q[i] = q[i + 1] = undefined; // recycled array must retain nothing
        fn(arg);
      }
      this.lastIx = batchEnd;
      // `last` may have scheduled fresh prioritized work — loop again.
    }
    // drained clean: reset the cursors for the next moment (see the pool)
    this.lastN = 0;
    this.lastIx = 0;
  }

  // One recycled instance: a moment is Transaction + three queue arrays,
  // and update-heavy apps open millions of them. A moment that completed
  // cleanly leaves every queue empty (drainLoop resets lastQ, the heap is
  // popped dry, postQ is cleared below), so the object can be reused as-is.
  // A moment that THREW is abandoned — its queues may hold stale work.
  private static pool: Transaction | null = null;

  // Run `f` inside a transaction. Nested calls reuse the enclosing moment.
  static run<A>(f: (t: Transaction) => A): A {
    const existing = Transaction.current;
    if (existing) return f(existing);

    const pooled = Transaction.pool;
    let t: Transaction;
    if (pooled !== null) {
      Transaction.pool = null;
      pooled.id = Transaction.idCounter++; // a fresh MOMENT in a reused shell
      t = pooled;
    } else {
      t = new Transaction();
    }
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
    // from an observer opens a brand-new moment (which allocates its own
    // transaction — this one is not in the pool yet, so no aliasing).
    // Observers are isolated: one throwing does not stop the rest; the
    // first error is rethrown.
    const posts = t.postQ;
    const postN = t.postN;
    let firstErr: unknown;
    let hasErr = false;
    for (let i = 0; i < postN; i += 2) {
      const fn = posts[i] as (x: unknown) => void;
      const arg = posts[i + 1];
      posts[i] = posts[i + 1] = undefined; // recycled array must retain nothing
      try {
        fn(arg);
      } catch (err) {
        if (!hasErr) {
          hasErr = true;
          firstErr = err;
        }
      }
    }
    t.postN = 0;
    Transaction.pool = t;
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

// Shared frozen snapshot for listener-less delivery (send_ to nobody).
const EMPTY_SNAP: Array<Edge<any>> = [];

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
  // Observer edges. MOST nodes carry exactly one (a binding chain), so the
  // first edge lives INLINE in `ob0` and the array exists only from the
  // second subscriber on (heap profiles: ~64 B of array per single-listener
  // node, 20k of them at 10k rows). Once spilled, a node stays on the array
  // — churn between 1 and 2 listeners must not re-allocate it. Invariant:
  // ob0 and obs are never both non-null. `Edge.i` is -2 for the inline
  // slot, the array index otherwise, -1 once removed.
  private ob0: Edge<any> | null = null;
  // Array form, slot-style: removal swaps with the last edge (O(1), no
  // hashing). Rank propagation walks the same edges via `Edge.t` — the old
  // separate refcounted targets Map was this information duplicated.
  // Relative delivery order of two surviving listeners may change after an
  // unrelated removal (same as Solid's slots); effects still run in
  // delivery order within a moment.
  // typed `any` so Edge's contravariant handler slot does not make
  // Stream invariant in A (State<string> must stay a State<unknown>)
  private obs: Array<Edge<any>> | null = null;
  /** Cached delivery snapshot of `obs`; invalidated on mutation. */
  private snap: Array<Edge<any>> | null = null;
  /** Teardown handles for this node's own subscriptions to its inputs. */
  private cleanups: Array<() => void> | null = null;
  /**
   * Recipe inputs of a demand-activated (pure) node: subscribed on the
   * first listener, torn down after the last one. Stateful nodes
   * (hold/accum/once/distinct/switch) use `consume` instead — their value
   * depends on the full history and must not miss occurrences.
   */
  // flat [input0, handler0, input1, handler1, …] — no per-entry object
  private srcs: unknown[] | null = null;
  /** Live attachments while awake, interleaved [src, edge, …]; null asleep. */
  private live: unknown[] | null = null;
  /** @internal Reseed hook run on wake, before inputs attach (lift caches). */
  onWake: (() => void) | null = null;
  /** @internal Extra teardown run on sleep/dispose (flatten's inner subscription). */
  onSleep: (() => void) | null = null;
  // bit 1 — disposed, bit 2 — pinned (retain): two booleans in one slot
  private flags = 0;

  /** True once `dispose()` has run. */
  get disposed(): boolean {
    return (this.flags & 1) !== 0;
  }

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
      const o0 = n.ob0;
      if (o0 !== null) {
        const t0 = o0.t;
        if (t0 !== null && t0 !== POST) {
          if (onPath.has(t0))
            throw new Error("Continuum: dependency cycle detected");
          stack.push({ n: t0, l: n.rank });
        }
      } else if (n.obs) {
        for (const e of n.obs) {
          const t = e.t;
          if (t === null || t === POST) continue;
          if (onPath.has(t))
            throw new Error("Continuum: dependency cycle detected");
          // duplicate edges to one target just revisit an already-high rank
          stack.push({ n: t, l: n.rank });
        }
      }
    }
  }

  /** @internal Register an in-graph subscriber. Returns an unsubscribe handle. */
  listen_(target: Stream<any> | null, h: Handler<A>): Unlisten {
    const rec = this.attach_(target, h);
    return () => this.unlisten_(rec);
  }

  /** @internal Closure-free subscription: returns the edge record. The
   * handler kind must match the target (Observer for POST, Handler else) —
   * see the Edge discriminant. */
  attach_(target: Stream<any> | null, h: Handler<A> | Observer<A>): Edge<any> {
    if ((this.flags & 1) !== 0) {
      throw new Error(
        "Continuum: this node was disposed — dispose() was called on it — " +
          "and cannot be re-subscribed. Create derivations inside the " +
          "scope that uses them.",
      );
    }
    const rec: Edge<any> = { h, t: target, i: -2 };
    const obs = this.obs;
    if (obs === null) {
      const first = this.ob0;
      if (first === null) {
        // first observer overall — the inline slot, no array
        this.ob0 = rec;
        this.wake();
      } else {
        // second observer: spill the inline edge into a fresh array
        first.i = 0;
        rec.i = 1;
        this.obs = [first, rec];
        this.ob0 = null;
        this.snap = null;
      }
    } else {
      rec.i = obs.length;
      obs.push(rec);
      this.snap = null;
      if (obs.length === 1) this.wake(); // array drained earlier, now refilled
    }
    // keep the target strictly above this source (handles dynamic
    // subscriptions from flatten onto deeper events).
    if (target !== null && target !== POST) target.ensureBiggerThan(this.rank);
    return rec;
  }

  /** @internal O(1) edge removal: clear the inline slot, or swap with the
   * array's last edge and fix its index. */
  unlisten_(rec: Edge<any>): void {
    if (rec === this.ob0) {
      this.ob0 = null;
      rec.i = -1;
      this.sleep();
      return;
    }
    const obs = this.obs;
    if (!obs || rec.i < 0) return;
    const last = obs.pop()!;
    if (last !== rec) {
      obs[rec.i] = last;
      last.i = rec.i;
    }
    rec.i = -1;
    this.snap = null;
    this.sleep(); // no-op unless a lazy node just lost its last listener
  }

  /** @internal Push an occurrence to every current subscriber. */
  send_(t: Transaction, a: A): void {
    // Delivery iterates a snapshot: a listener added during delivery must
    // NOT see this occurrence, one removed during delivery still does (see
    // the bookkeeping tests).
    const o0 = this.ob0;
    if (o0 !== null) {
      // Single observer: the captured record IS the snapshot — an attach
      // during delivery lands in ob0-spilled storage and is not visited; a
      // removal cannot un-run this call.
      // (The sentinel target discriminates the union in `Edge.h`: a POST
      // edge carries the user callback — schedule it for the observer
      // phase without a per-listen wrapper closure.)
      if (o0.t === POST) t.post(o0.h as Observer<A>, a);
      else (o0.h as Handler<A>)(t, a);
      return;
    }
    if (this.obs === null) return;
    // The array snapshot is CACHED between mutations — fan-out sources fire
    // far more often than they churn listeners, so steady-state delivery
    // allocates nothing.
    const ls = (this.snap ??= this.obs.length > 0 ? [...this.obs] : EMPTY_SNAP);
    for (const e of ls) {
      if (e.t === POST) t.post(e.h as Observer<A>, a);
      else (e.h as Handler<A>)(t, a);
    }
  }

  /** @internal Register a lazy input (see `srcs`). */
  source<X>(input: Stream<X>, h: Handler<X>): void {
    (this.srcs ??= []).push(input, h);
    if (this.live) {
      this.live.push(input, input.attach_(this, h));
    }
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
        // set before attaching: source() during wake appends
        const live: unknown[] = (n.live = []);
        const srcs = n.srcs;
        for (let i = 0; i < srcs.length; i += 2) {
          const input = srcs[i] as Stream<any>;
          live.push(input, input.attach_(n, srcs[i + 1] as Handler<any>));
        }
      }
    } finally {
      wakeQueue = null;
    }
  }

  private sleep(): void {
    if (
      (this.flags & 2) !== 0 ||
      this.ob0 !== null ||
      (this.obs?.length ?? 0) > 0
    )
      return;
    const live = this.live;
    if (live) {
      this.live = null;
      // inputs lose a listener -> they may sleep too
      for (let i = 0; i < live.length; i += 2) {
        (live[i] as Stream<any>).unlisten_(live[i + 1] as Edge<any>);
      }
      this.onSleep?.();
    } else if (this.srcs === null) {
      // A LEAF (source node) losing its last observer: report via onSleep so
      // owners of ephemeral leaf cells (selector) can evict them. A recipe
      // node that never woke has nothing to tear down and keeps its onSleep
      // for the live teardown above.
      this.onSleep?.();
    }
  }

  /** @internal Subscribe this node to `input` (rank-tracked). */
  subscribe<X>(input: Stream<X>, h: Handler<X>): Unlisten {
    return input.listen_(this, h);
  }

  /** @internal Subscribe to `input` and register the teardown for `dispose()`. */
  consume<X>(input: Stream<X>, h: Handler<X>): void {
    (this.cleanups ??= []).push(this.subscribe(input, h));
  }

  /** @internal Register an extra teardown to run on `dispose()`. */
  onDispose(fn: () => void): void {
    (this.cleanups ??= []).push(fn);
  }

  /**
   * Detach this node from its inputs (breaking the push chain so it can be
   * collected) and drop its downstream links. Idempotent. Cascades upstream
   * through derived intermediates that become unused, but never to sources.
   */
  dispose(): void {
    if ((this.flags & 1) !== 0) return;
    this.flags |= 1;
    if (this.live) {
      const live = this.live;
      this.live = null;
      for (let i = 0; i < live.length; i += 2) {
        (live[i] as Stream<any>).unlisten_(live[i + 1] as Edge<any>);
      }
      this.onSleep?.();
    }
    this.srcs = null;
    const cs = this.cleanups;
    this.cleanups = null;
    if (cs) for (const c of cs) c();
    this.ob0 = null;
    this.obs = null;
    this.snap = null;
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
   * Step function: hold the last occurrence, committing at the moment
   * boundary. State — so it needs an owner: the process that keeps the value
   * current is registered in the ambient scope and detaches when the scope
   * disposes (the state then answers with its final value).
   */
  hold(init: A): State<A> {
    const scope = requireScope("hold()", "src.hold(init)");
    let value = init;
    // Staging is keyed by transaction identity, so an aborted (dropped)
    // moment leaves nothing to commit and never blocks a later moment.
    let stagedTx: Transaction | null = null;
    let stagedVal: A;
    // ONE commit closure per node, re-queued per staged moment (an aborted
    // moment drops its queue, so a non-null stagedTx here means OUR moment
    // is committing — see Cell.commit for the full argument).
    const commit = () => {
      if (stagedTx !== null) {
        value = stagedVal;
        stagedTx = null;
      }
    };
    const updates = new Stream<A>(this.rank + 1);
    const un = this.listen_(updates, (t, a) => {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(commit);
      }
      stagedVal = a; // last write wins within a moment
      updates.send_(t, a);
    });
    scope.onDispose(un);
    return new State<A>(() => value, updates);
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
    // one commit closure per node, not per moment (see hold)
    const commit = () => {
      if (stagedTx !== null) {
        value = staged;
        stagedTx = null;
      }
    };
    const un = this.listen_(out, (t, a) => {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(commit);
      }
      staged = f(a, value); // folds over the committed (pre-moment) state
      out.send_(t, staged);
    });
    scope.onDispose(un);
    return out;
  }

  /**
   * Fold occurrences into a behavior. Fused: one node and one edge instead
   * of the accumE + hold pair — every counter in every app pays half.
   */
  accum<B>(init: B, f: (a: A, acc: B) => B): State<B> {
    const scope = requireScope("accum()", "src.accum(init, f)");
    const out = new Stream<B>(this.rank + 1);
    let value = init;
    let stagedTx: Transaction | null = null;
    let staged: B;
    // one commit closure per node, not per moment (see hold)
    const commit = () => {
      if (stagedTx !== null) {
        value = staged;
        stagedTx = null;
      }
    };
    const un = this.listen_(out, (t, a) => {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(commit);
      }
      staged = f(a, value); // folds over the committed (pre-moment) state
      out.send_(t, staged);
    });
    scope.onDispose(un);
    return new State<B>(() => value, out);
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
    // one commit closure per node, not per moment (see hold)
    const spend = () => {
      if (stagedTx !== null) {
        fired = true;
        stagedTx = null;
      }
    };
    out.source(this, (t, a) => {
      if (fired || stagedTx === t) return;
      // spend the once at the boundary — an aborted moment leaves it armed
      stagedTx = t;
      t.last(spend);
      out.send_(t, a);
    });
    return out;
  }

  /** Pass occurrences only while the state is true. */
  when(b: State<boolean>): Stream<A> {
    const out = new Stream<A>(this.rank + 1);
    out.source(this, (t, a) => {
      if (b.sampleNoTrans()) out.send_(t, a);
    });
    return out;
  }

  /** Left-biased merge: on simultaneous occurrences the left wins. */
  or(other: Stream<A>): Stream<A> {
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
    const rec = this.attach_(POST, h);
    return () => this.unlisten_(rec);
  }

  /**
   * Performance hint: keep a pure derivation attached across listener churn
   * instead of sleeping and re-waking (useful for a hot shared chain whose
   * listeners come and go). Never required for correctness.
   */
  retain(): this {
    this.flags |= 2;
    return this;
  }
}

// Sentinel target marking a LEAF OBSERVER edge: its handler is the user
// callback `(a) => void`, and `send_` posts it to the observer phase
// directly. This kills the `(t, a) => t.post(h, a)` wrapper closure every
// `listen()` used to allocate. Rank machinery skips the sentinel.
// (Below the class: `new Stream` needs the declaration evaluated.)
const POST = new Stream<any>(0);

// ---------------------------------------------------------------------------
// State<A> — a value across time (pull) + discrete `updates` (push).
// ---------------------------------------------------------------------------

/**
 * A value across time (pull) with discrete change notifications (push).
 * Denotationally `Time → A`: it always has a value — `sample()` never misses.
 */
export class State<A> {
  constructor(
    /** Pull the current value without opening a transaction. */
    public sampleNoTrans: () => A,
    /** Push notifications of discrete changes (empty for continuous behaviors). */
    public updates: Stream<A>,
  ) {}

  sample(): A {
    // A pure read schedules nothing, so it needs no moment: reading inside
    // a transaction sees the committed (pre-moment) value either way.
    // Measured ~8× cheaper than opening a Transaction per read.
    return this.sampleNoTrans();
  }

  /** Pointwise transform (continuous-safe: recomputed on each sample). */
  map<B>(f: (a: A) => B): State<B> {
    return new State<B>(() => f(this.sampleNoTrans()), this.updates.map(f));
  }

  /**
   * Sample this state at each occurrence of `e`: `draft.at(submits)` is the
   * stream of the state's values as of those moments (pre-moment, with exact
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

  /** Continuous behavior: sampled fresh on each read; no discrete updates. */
  static fromPoll<A>(poll: () => A): State<A> {
    return new State<A>(poll, new Stream<A>(0));
  }
}

// The two-input join every `combine` reduces to (a static `State.lift2`
// until 1.0).
function lift2<A, B, C>(
  f: (a: A, b: B) => C,
  ba: State<A>,
  bb: State<B>,
): State<C> {
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
  // one commit closure per join, not per moment (see hold); a mid-moment
  // reseed sets stagedTx to null, which also disarms a queued commit
  const commit = () => {
    if (stagedTx !== null) {
      if (hasSa) va = sa;
      if (hasSb) vb = sb;
      stagedTx = null;
      hasSa = false;
      hasSb = false;
    }
  };
  const stage = (t: Transaction) => {
    if (stagedTx !== t) {
      stagedTx = t;
      hasSa = false;
      hasSb = false;
      t.last(commit);
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
  return new State<C>(() => f(ba.sampleNoTrans(), bb.sampleNoTrans()), out);
}

/**
 * The state-of-states switch behind `flatten` (a public static until 1.0).
 *
 * A formula: cold it is a recipe (pull samples straight through); waking
 * attaches the outer state AND the currently selected inner; sleeping
 * detaches both. Rewiring while warm commits at the moment boundary.
 */
function switchB<A>(bb: State<State<A>>): State<A> {
  const out = new Stream<A>(bb.updates.rank + 1);
  let innerUn: Unlisten | null = null;
  const attach = (b: State<A>) => {
    innerUn = out.subscribe(b.updates, (t, a) => out.send_(t, a));
  };
  out.source(bb.updates, (t, nb) => {
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
      // Emit the new selection's value AFTER this moment's commits (a
      // fresh last batch): on a simultaneous switch + inner update the
      // push side then agrees with the pull side (law 1).
      t.last(() => out.send_(t, nb.sampleNoTrans()));
    });
  });
  out.onWake = () => attach(bb.sampleNoTrans());
  out.onSleep = () => {
    if (innerUn) {
      innerUn();
      innerUn = null;
    }
  };
  return new State<A>(() => bb.sampleNoTrans().sampleNoTrans(), out);
}

/**
 * The state-of-streams switch behind `flatten` (a public static until 1.0).
 *
 * A formula (see switchB): waking attaches the CURRENT selection, even
 * one chosen while asleep.
 */
function switchE<A>(be: State<Stream<A>>): Stream<A> {
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
  // Keyed by MOMENT id, not object identity: the transaction shell is
  // pooled, so a saved reference would alias the next moment too.
  let lastId = -1;
  return (a: A) => {
    if (Transaction.current?.pureZone) {
      throw new Error(
        "Source fired inside a pure combinator (map/filter/snapshot/accum). " +
          "Keep those callbacks pure — fire from a handler, `listen`, or `perform`.",
      );
    }
    Transaction.run((t) => {
      if (once) {
        if (t.id === lastId)
          throw new Error(
            "Continuum: a source may fire once per moment — merge distinct " +
              "streams with an explicit combine, or use a behavior's setter " +
              "for last-write-wins.",
          );
        lastId = t.id;
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
// used by processes (`state().on()`); `set` is the public entry that opens a
// moment.

// The shared pull for every cell: one function object for ALL cells instead
// of a `() => this.value` closure per cell. Only ever called method-style
// (`w.sampleNoTrans()`), so `this` is the cell; the stored view is the
// plain `() => A` that State declares — a this-typed function has no subtype
// relation to it, hence the one widening cast HERE and nowhere else.
const cellSample = function (this: Cell<unknown>): unknown {
  return this.value;
} as () => unknown;

// A source cell fused INTO its state: one object carries the committed value,
// the staging slot and the whole State surface. Round 4 cut the cell from ~7
// allocations to 4 (Cell + State + Stream + pull closure); this round fuses
// the first two and shares the pull — a cell is now Stream + this object.
class Cell<A> extends State<A> {
  /** @internal The committed value (read by `cellSample`). */
  value: A;
  /** @internal */
  protected eq: (prev: A, next: A) => boolean;
  private stagedTx: Transaction | null = null;
  private staged!: A;
  // Cached prioritized action — one closure per cell LIFETIME (lazy, on the
  // first stage) instead of one per moment; a set used to cost two fresh
  // closures (this and the commit, now a flat pair below).
  private sendFn: ((t: Transaction) => void) | null = null;

  constructor(init: A, eq: (prev: A, next: A) => boolean) {
    super(cellSample as () => A, new Stream<A>(0));
    this.value = init;
    this.eq = eq;
  }

  // End-of-moment commit, shared by ALL cells via a flat (fn, cell) lastQ
  // pair. Safe without a transaction guard: the pair dies with an aborted
  // moment, and inside a committing moment `stagedTx` is non-null exactly
  // when a staging round queued this pair (only the commit itself resets
  // it; a later round in the same moment queues its own pair).
  private static commit(c: Cell<unknown>): void {
    if (c.stagedTx !== null) {
      c.value = c.staged;
      c.stagedTx = null;
    }
  }

  /** Staged value if this moment already wrote one, else the committed one. */
  pending(t: Transaction | null): A {
    return t !== null && this.stagedTx === t ? this.staged : this.value;
  }

  stage(t: Transaction, a: A): void {
    if (this.stagedTx !== t) {
      this.stagedTx = t;
      t.last(Cell.commit, this as Cell<unknown>);
      // ONE updates occurrence per moment — the final staged value.
      // Several sets in one batch coalesce; the intermediate values never
      // reach the graph (they are not values the cell ever held).
      t.prioritized(
        this.updates.rank,
        (this.sendFn ??= (t2) => {
          if (this.stagedTx === t2) this.updates.send_(t2, this.staged);
        }),
      );
    }
    this.staged = a; // last write wins within a moment
  }

  // Skip against the PENDING value: the staged one if this very moment
  // already wrote (4 → 5 → 4 in one batch must commit 4), else the
  // committed one. Staging dies with an aborted moment, so the skip can
  // never be poisoned by a throw (law 2) — no side variable to desync.
  // Named `write` (not `set`) so SourceCell's detachable `set` field can
  // delegate here without shadowing itself.
  write(a: A): void {
    const t0 = Transaction.current;
    if (this.eq(this.pending(t0), a)) return;
    if (t0?.pureZone) {
      throw new Error(
        "Source fired inside a pure combinator (map/filter/at/accum). " +
          "Keep those callbacks pure — fire from a handler, `listen`, or `perform`.",
      );
    }
    Transaction.run((t) => this.stage(t, a));
  }

  // Read-modify-write over the PENDING value: several updates inside one
  // batch compose (set(sample() + 1) would read the stale pre-moment value
  // twice — that is the hold delay working as documented).
  modify(f: (state: A) => A): void {
    this.write(f(this.pending(Transaction.current)));
  }
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

/** @internal Observer handle (an edge record) for `observe_` — opaque to
 * the renderer, which only stores and returns it. */
export type ObserverHandle = Edge<any>;

/**
 * @internal Closure-free observer subscription for the dom renderer: like
 * `listen`, but returns the edge record instead of an unlisten closure. The
 * renderer stores flat (stream, handle) pairs on its owners — two array
 * slots where `listen` costs two closures per binding.
 */
export function observe_<A>(e: Stream<A>, h: Observer<A>): ObserverHandle {
  return e.attach_(POST, h);
}

/** @internal Detach a subscription made with `observe_`. */
export function unobserve_(e: Stream<unknown>, handle: ObserverHandle): void {
  e.unlisten_(handle);
}

// ---------------------------------------------------------------------------
// The declarative surface (REFACTOR-PLAN phase 1): data first, names as
// intents. The theory-flavored forms above stay as deprecated aliases
// until 1.0.
// ---------------------------------------------------------------------------

/** A source state: a cell you read like any state and write via `.set`. */
export interface StateSource<A> extends State<A> {
  /** Set the current value; equal values (by the cell's `eq`) are a no-op. */
  set(a: A): void;
  /**
   * Read-modify-write: fold the updater over the current value —
   * `count.update((n) => n + 1)`. Inside a `batch` the updater sees the
   * value staged by this very moment, so several updates compose (unlike
   * `set(sample() + 1)`, which reads the pre-moment value). Equal results
   * (by the cell's `eq`) are a no-op.
   */
  update(f: (state: A) => A): void;
  /**
   * Declare a state transition: on each occurrence of `e`, fold the reducer
   * over the current value — `(state, event) => next`, `useReducer` order.
   * The occurrence and the state's update share ONE moment (snapshot
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
 * A source cell: the everyday way to create state. Reads like any state
 * (`sample`, `map`, JSX binding), writes via `.set` — setting an equal value
 * (by `eq`, default `Object.is`) is a no-op.
 */
// The public source cell behind `state()`. `set`/`update` are per-instance
// arrows because the examples pass them detached (`bindInput(draft,
// draft.set)`); everything else lives on the prototype. The old shape was
// `Object.assign` onto a plain State — three closures plus a hidden-class
// fork on the hottest read path.
class SourceCell<A> extends Cell<A> implements StateSource<A> {
  set: (a: A) => void = (a) => this.write(a);
  update: (f: (state: A) => A) => void = (f) => this.modify(f);

  on<E>(e: Stream<E>, f: (state: A, event: E) => A): this {
    const scope = requireScope("state(...).on(...)", "state(0).on(e, f)");
    const un = e.listen_(this.updates, (t, ev) => {
      const next = f(this.pending(t), ev);
      if (this.eq(this.pending(t), next)) return;
      this.stage(t, next);
    });
    scope.onDispose(un);
    return this;
  }
}

export function state<A>(
  init: A,
  eq: (prev: A, next: A) => boolean = Object.is,
): StateSource<A> {
  return new SourceCell(init, eq);
}

/**
 * Keyed selection with O(2) updates. ONE process watches `w`; each key gets
 * a tiny cell that flips only when the selection enters or leaves it —
 * selecting a row in a 10k list updates two cells instead of recomputing
 * 10k derivations. Both flips share the moment of the selection change.
 *
 * `selector(selected)` yields `(key) => State<boolean>`; the value form
 * `selector(selected, on, off)` yields ready-to-bind values
 * (`class={cls(row.id)}`). The watching process belongs to the ambient
 * scope. A key's cell lives while anything listens to it and is evicted
 * once the last listener detaches (10k cleared rows must not be retained);
 * re-requesting the key hands out a fresh cell seeded from the current
 * selection.
 */
export function selector<K>(w: State<K>): (key: K) => State<boolean>;
export function selector<K, V>(
  w: State<K>,
  on: V,
  off: V,
): (key: K) => State<V>;
export function selector<K, V>(
  w: State<K>,
  on?: V,
  off?: V,
): (key: K) => State<boolean | V> {
  const scope = requireScope("selector()", "selector(selected)");
  const onVal = arguments.length >= 3 ? (on as V) : (true as boolean | V);
  const offVal = arguments.length >= 3 ? (off as V) : (false as boolean | V);
  const cells = new Map<K, Cell<boolean | V>>();
  let current = w.sampleNoTrans();
  // `current` commits at the boundary like everything else (law 2); the
  // pending key is staged so ONE closure serves every moment (see hold)
  let nextKey: K;
  const commit = () => {
    current = nextKey;
  };
  const un = w.updates.listen_(null, (t, k) => {
    const prev = cells.get(current);
    if (prev) prev.stage(t, offVal);
    const next = cells.get(k);
    if (next) next.stage(t, onVal);
    nextKey = k;
    t.last(commit);
  });
  scope.onDispose(un);
  return (key: K) => {
    let c = cells.get(key);
    if (!c) {
      c = new Cell<boolean | V>(key === current ? onVal : offVal, Object.is);
      // Evict once the last listener detaches: 10k cleared rows must not
      // stay in the Map forever. A re-requested cell reseeds from `current`.
      c.updates.onSleep = () => {
        cells.delete(key);
      };
      cells.set(key, c);
    }
    return c;
  };
}

/** A source stream plus its `fire`, as one value. */
export function stream<A>(): StreamSource<A> {
  const [e, fire] = newStream<A>();
  return Object.assign(e, { fire });
}

/**
 * Combine states pointwise — the join of the graph. Data first, the combiner
 * last; simultaneous updates coalesce into ONE recompute per moment
 * (glitch-free, see FRP-MODEL §3).
 */
export function combine<A, B, R>(
  a: State<A>,
  b: State<B>,
  f: (a: A, b: B) => R,
): State<R>;
export function combine<A, B, C, R>(
  a: State<A>,
  b: State<B>,
  c: State<C>,
  f: (a: A, b: B, c: C) => R,
): State<R>;
export function combine<A, B, C, D, R>(
  a: State<A>,
  b: State<B>,
  c: State<C>,
  d: State<D>,
  f: (a: A, b: B, c: C, d: D) => R,
): State<R>;
export function combine<A, B, C, D, E, R>(
  a: State<A>,
  b: State<B>,
  c: State<C>,
  d: State<D>,
  e: State<E>,
  f: (a: A, b: B, c: C, d: D, e: E) => R,
): State<R>;
export function combine(...args: unknown[]): State<unknown> {
  const f = args[args.length - 1] as (...xs: unknown[]) => unknown;
  const ws = args.slice(0, -1) as Array<State<unknown>>;
  if (ws.length === 2) return lift2(f, ws[0], ws[1]);
  // Wider joins fold through pair nodes; coalescing keeps it one recompute
  // per moment regardless of arity.
  let acc: State<unknown[]> = lift2((x, y) => [x, y], ws[0], ws[1]);
  for (let i = 2; i < ws.length; i++) {
    acc = lift2((xs, y) => [...(xs as unknown[]), y], acc, ws[i]);
  }
  return acc.map((xs) => f(...xs));
}

/**
 * Follow the state (or stream) currently selected by an outer state —
 * `State<State<A>> → State<A>` and `State<Stream<A>> → Stream<A>` under one
 * name. The switch commits at the moment boundary (see FRP-MODEL §6).
 */
export function flatten<A>(w: State<State<A>>): State<A>;
export function flatten<A>(w: State<Stream<A>>): Stream<A>;
export function flatten<A>(
  w: State<State<A>> | State<Stream<A>>,
): State<A> | Stream<A> {
  return w.sampleNoTrans() instanceof State
    ? switchB(w as State<State<A>>)
    : switchE(w as State<Stream<A>>);
}

/** The behavior that is `v` at every moment (applicative `pure`). */
export function constant<A>(v: A): State<A> {
  return new State<A>(() => v, new Stream<A>(0));
}

/** The event with no occurrences (identity of `merge`). */
export function never<A>(): Stream<A> {
  return new Stream<A>(0);
}

/** Continuous wall-clock behavior (milliseconds), sampled on demand. */
export function time(): State<number> {
  return State.fromPoll(() => Date.now());
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
  // one commit closure per node, not per moment (see hold); a wake mid-
  // moment resets stagedTx to null, which also disarms a queued commit
  const commit = () => {
    if (stagedTx !== null) {
      hasPrev = true;
      prev = staged;
      stagedTx = null;
    }
  };
  out.source(e, (t, a) => {
    if (!hasPrev || !eq(prev, a)) {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(commit);
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
