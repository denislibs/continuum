// Continuum — DOM renderer (dom).
// Fine-grained rendering over the frp core: bindings, dynamic regions,
// keyed lists, an ownership tree for lifecycle, and context.

import {
  State,
  Stream,
  state,
  stream,
  Scope,
  getScope,
  runInScope,
  observe_,
  unobserve_,
} from "@continuum-js/frp";
import type { Unlisten, StateSource, ObserverHandle } from "@continuum-js/frp";

// ---------------------------------------------------------------------------
// Ownership tree (§9) — lifecycle, not dependency tracking.
//
// The tree itself lives in the core (`Scope` from frp): the ambient owner IS
// the core's ambient scope, so frp state (`hold`/`accum`) created during a
// component build attaches to the component automatically. This class only
// adds what is dom-specific: onMount queues and context values.
// ---------------------------------------------------------------------------

class Owner extends Scope {
  // Lazily allocated, like `contexts` — most owners never use `onMount`.
  mounts: Array<() => void> | null = null;
  // Lazily allocated — most owners never carry context, so we skip the Map
  // until `provide` writes one (hot path when building many rows).
  contexts: Map<symbol, unknown> | null = null;
  /** Top-level nodes of a scoped build: the single-node fast path stores
   * the node itself — no array for the common one-element row. */
  nodes: Node | Node[] | null = null;
  // State bindings as flat (updates, edge-handle) pairs — see bindState.
  subs: unknown[] | null = null;

  /** Whether this subtree's onMount callbacks have run (bit 2 of Scope.flags). */
  get mounted(): boolean {
    return (this.flags & 2) !== 0;
  }

  dispose(): void {
    if (this.disposed) return;
    super.dispose();
    this.mounts = null; // never mounted → its onMount callbacks never run
    const subs = this.subs;
    if (subs) {
      this.subs = null;
      for (let i = 0; i < subs.length; i += 2) {
        unobserve_(subs[i] as Stream<unknown>, subs[i + 1] as ObserverHandle);
      }
    }
  }

  /** Run this subtree's pending onMount callbacks (post-insertion). */
  flush(): void {
    flushMounts(this);
  }
}

// The ambient owner, when the ambient scope is a dom one. Building under a
// plain frp scope (a bare `root()` from the core) still attaches cleanups —
// only dom-specific features (onMount, context) need a real Owner.
function currentOwner(): Owner | null {
  const s = getScope();
  return s instanceof Owner ? s : null;
}

/** Root owner (a mount point). `fn` receives its dispose handle. */
export function root<T>(fn: (dispose: () => void) => T): T {
  const owner = new Owner(null);
  return runInScope(owner, () => fn(() => owner.dispose()));
}

/** Child owner under the current one. Returns its value and dispose handle. */
export function scope<T>(fn: () => T): { value: T; dispose: () => void } {
  const owner = new Owner(getScope());
  const value = runInScope(owner, fn);
  return { value, dispose: () => owner.dispose() };
}

// Lifecycle registrations need an owner; silently dropping them (the old
// behavior) meant cleanups that never ran. Loud beats silent-dead.
function needScope(what: string): Scope {
  const s = getScope();
  if (!s) {
    throw new Error(
      what +
        " was called outside a component/scope — there is no owner to " +
        "attach it to, so it would never run. Call it synchronously during " +
        "component build (or inside root()/scope()).",
    );
  }
  return s;
}

/** Register a cleanup in the current owner. Throws outside any owner. */
export function onCleanup(fn: () => void): void {
  needScope("onCleanup()").onDispose(fn);
}

// Run the subtree's pending onMount callbacks: child scopes first, then this
// owner's own, newest registration first. With the idiomatic `onMount` at the
// top of a component body, that yields children-before-parents. Callbacks run
// UNDER their owner, so the documented composable anatomy — onCleanup (and
// provide/use) inside onMount — attaches to the mounting scope. Without this,
// regions inserted by dyn/each flushed ownerless and the lifecycle guard threw.
function flushMounts(scope: Scope): void {
  if (scope.disposed) return;
  if (scope.children) for (const child of scope.children) flushMounts(child);
  if (!(scope instanceof Owner)) return;
  scope.flags |= 2; // mounted
  const mounts = scope.mounts;
  if (mounts) {
    scope.mounts = null;
    runInScope(scope, () => {
      for (let i = mounts.length - 1; i >= 0; i--) mounts[i]();
    });
  }
}

/**
 * Register a callback to run once the current scope's nodes are inserted into
 * the DOM — after `mount`, or right after a dynamic region (`dyn`/`each`)
 * inserts a freshly built subtree. Use it for focus, measurement, and
 * third-party libraries that need a live element. No-op outside any owner.
 */
export function onMount(fn: () => void): void {
  needScope("onMount()");
  const owner = currentOwner();
  if (!owner) {
    throw new Error(
      "onMount() needs a dom owner (a component, mount(), or dom's root()) — " +
        "a bare frp scope has no mount lifecycle.",
    );
  }
  (owner.mounts ??= []).push(fn);
}

// Attach an frp subscription to the current owner's lifecycle. Deliberately
// NOT guarded: JSX built outside any owner (an unowned static fragment) has
// always been allowed — its bindings just live forever.
function bind(un: Unlisten): void {
  getScope()?.onDispose(un);
}

// Bind `h` to a state — `w.listen(h)` semantics (current value now, then
// every change) without the closure tax: the subscription is an edge record
// stored as a flat (stream, handle) pair on the Owner. A binding used to
// cost two closures plus a cleanups slot; it is now two array slots.
function bindState<T>(w: State<T>, h: (v: T) => void): void {
  const handle = observe_(w.updates, h);
  try {
    h(w.sampleNoTrans());
  } catch (err) {
    unobserve_(w.updates, handle); // don't leak the subscription (see State.listen)
    throw err;
  }
  const s = getScope();
  if (s !== null && hasSubs(s)) (s.subs ??= []).push(w.updates, handle);
  else if (s) s.onDispose(() => unobserve_(w.updates, handle));
  // no scope: an unowned static fragment — the binding lives forever (as before)
}

// Duck-typed Owner check (only Owner declares `subs`): an `instanceof
// Owner` inside bindState would drag the whole Owner/Scope machinery into
// the compiled-template bundle, which otherwise tree-shakes it away. The
// guard mentions Owner as a TYPE only — erased at runtime.
function hasSubs(s: Scope): s is Owner {
  return (s as Owner).subs !== undefined;
}

// ---------------------------------------------------------------------------
// JSX factory (§6.4)
// ---------------------------------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";

// SVG-specific tag names. Ambiguous names shared with HTML (a, title, script,
// style) are treated as HTML; use them inside `foreignObject` for HTML content.
const SVG_TAGS = new Set([
  "svg",
  "g",
  "defs",
  "symbol",
  "use",
  "image",
  "switch",
  "foreignObject",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textPath",
  "marker",
  "desc",
  "metadata",
  "view",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix",
  "feComposite",
  "feFlood",
  "feMerge",
  "feMergeNode",
  "feImage",
  "feTile",
  "feMorphology",
  "feDisplacementMap",
  "feTurbulence",
  "animate",
  "animateTransform",
  "animateMotion",
  "mpath",
  "set",
]);

function createEl(tag: string): Element {
  return SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
}

/** Anything placeable in JSX: nodes, behaviors (live-bound), primitives, arrays. */
export type Child =
  | Node
  | State<unknown>
  | string
  | number
  | boolean
  | null
  | undefined
  | Child[];

// Helper types for writing typed components (type-only: no runtime import
// cycle — jsx-runtime imports our values, we re-export only its types).
export type {
  ComponentProps,
  Reactive,
  Ref,
  EventHandler,
} from "./jsx-runtime.js";
export type * from "./events.js";
// The same aliases as a namespace — `Events.MouseEvent<…>` — for files that
// prefer not to shadow the DOM globals.
export type * as Events from "./events.js";

type Props = Record<string, unknown> | null;

function toText(v: unknown): string {
  return v == null ? "" : String(v);
}

/** @internal Insert `child` before `anchor` (or append) — the one child
 * semantics shared by the JSX factory and the compiled-template runtime. */
export function insertChild(
  parent: Node,
  child: Child,
  anchor: Node | null = null,
): void {
  if (child == null || child === false || child === true) return;
  if (child instanceof State) {
    // fine-grained: one text node bound to one behavior
    const text = document.createTextNode("");
    bindState(child, (v) => (text.data = toText(v)));
    parent.insertBefore(text, anchor);
    return;
  }
  if (child instanceof Node) {
    parent.insertBefore(child, anchor);
    return;
  }
  if (Array.isArray(child)) {
    for (const c of child) insertChild(parent, c, anchor);
    return;
  }
  // primitive into an empty parent: textContent is the fastest text write
  if (anchor === null && parent.firstChild === null) {
    parent.textContent = String(child);
    return;
  }
  parent.insertBefore(document.createTextNode(String(child)), anchor);
}

function appendChild(parent: Node, child: Child): void {
  insertChild(parent, child, null);
}

function applyRef(ref: unknown, el: Element): void {
  if (typeof ref === "function") (ref as (el: Element) => void)(el);
  else if (ref && typeof ref === "object")
    (ref as { current: Element }).current = el;
}

// Apply a bound style value: object keys dropped since the previous
// delivery are reset before the new object is assigned.
function setStyle(el: Element, prev: unknown, next: unknown): void {
  const style = (el as HTMLElement).style as unknown as Record<string, string>;
  if (prev && typeof prev === "object" && next && typeof next === "object") {
    for (const k in prev as Record<string, unknown>) {
      if (!(k in (next as Record<string, unknown>))) style[k] = "";
    }
  }
  setProp(el, "style", next);
}

function setProp(el: Element, key: string, value: unknown): void {
  if (key === "class" || key === "className") {
    // SVG elements have a read-only `className` (SVGAnimatedString).
    if (el.namespaceURI === SVG_NS) {
      if (value == null) el.removeAttribute("class");
      else el.setAttribute("class", String(value));
    } else {
      (el as HTMLElement).className = value == null ? "" : String(value);
    }
    return;
  }
  if (key === "style") {
    if (value && typeof value === "object") {
      Object.assign((el as HTMLElement).style, value);
    } else {
      el.setAttribute("style", value == null ? "" : String(value));
    }
    return;
  }
  if (key === "value" || key === "checked") {
    (el as unknown as Record<string, unknown>)[key] = value;
    return;
  }
  if (typeof value === "boolean") {
    if (value) el.setAttribute(key, "");
    else el.removeAttribute(key);
    return;
  }
  if (value == null) {
    el.removeAttribute(key);
    return;
  }
  el.setAttribute(key, String(value));
}

// ---------------------------------------------------------------------------
// Event delegation (PERF-PLAN phase 1). Bubbling events register ONE
// document-level listener per type; the handler lives on the element as a
// `$$type` property and dies with the node — zero per-element
// addEventListener and zero cleanup closures. Contract (same as Solid):
// delegated handlers fire only for trees connected to the document.
// ---------------------------------------------------------------------------

// type -> element property key, precomputed ("$$" + evt concat per call
// showed up in create-10k profiles)
const DELEGATED_KEY = new Map<string, string>();
const DELEGATED = new Set([
  "beforeinput",
  "click",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "change",
  "keydown",
  "keyup",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "touchstart",
  "touchend",
  "touchmove",
]);

// Per-document set of event types with an installed root listener.
for (const t of DELEGATED) DELEGATED_KEY.set(t, "$$" + t);

const delegatedTypes = new WeakMap<Document, Set<string>>();

function delegatedDispatch(e: Event): void {
  const key = "$$" + e.type;
  let node = e.target as Node | null;
  while (node) {
    const h = (node as unknown as Record<string, unknown>)[key] as
      EventListener | undefined;
    if (h) {
      // handlers expect currentTarget = the element carrying the handler
      Object.defineProperty(e, "currentTarget", {
        configurable: true,
        value: node,
      });
      h.call(node, e);
      if (e.cancelBubble) return; // stopPropagation() halts the walk
    }
    node = node.parentNode;
  }
}

let lastDoc: Document | null = null;
let lastTypes: Set<string> | null = null;

function ensureDelegated(doc: Document, type: string): void {
  let types = lastTypes;
  if (doc !== lastDoc) {
    types = delegatedTypes.get(doc) ?? null;
    if (!types) {
      types = new Set();
      delegatedTypes.set(doc, types);
    }
    lastDoc = doc;
    lastTypes = types;
  }
  if (!types!.has(type)) {
    types!.add(type);
    doc.addEventListener(type, delegatedDispatch);
  }
}

/** @internal Bind one event prop (delegated when the type bubbles). */
export function applyEvent(
  el: Element,
  evt: string,
  handler: EventListener,
): void {
  const key = DELEGATED_KEY.get(evt);
  if (key !== undefined) {
    (el as unknown as Record<string, unknown>)[key] = handler;
    // template-content nodes live in an inert document (no window) until
    // adopted — the root listener belongs on the real one they'll join
    const doc = el.ownerDocument;
    ensureDelegated(doc && doc.defaultView ? doc : document, evt);
  } else {
    // non-bubbling (focus/blur/scroll/…): a direct listener as before
    el.addEventListener(evt, handler);
    bind(() => el.removeEventListener(evt, handler));
  }
}

/** @internal Apply one prop: ref, event, state binding or a plain value —
 * the semantics shared by the JSX factory and the compiled runtime. */
export function applyProp(el: Element, key: string, value: unknown): void {
  if (key === "ref") {
    applyRef(value, el);
    return;
  }
  if (key.length > 2 && key.startsWith("on")) {
    applyEvent(el, key.slice(2).toLowerCase(), value as EventListener);
    return;
  }
  if (value instanceof State) {
    if (key === "style") {
      // Diff against the previous object: a key that disappears must be
      // cleared, not left painted on the element.
      let prevStyle: unknown;
      bindState(value, (v) => {
        setStyle(el, prevStyle, v);
        prevStyle = v;
      });
    } else {
      bindState(value, (v) => setProp(el, key, v));
    }
    return;
  }
  setProp(el, key, value);
}

function applyProps(el: Element, props: Record<string, unknown>): void {
  for (const key in props) {
    if (key === "children") continue;
    applyProp(el, key, props[key]);
  }
}

/** Fragment marker for `--jsxFragmentFactory Fragment`. */
export function Fragment(props: { children?: Child }): Node {
  const frag = document.createDocumentFragment();
  appendChild(frag, props?.children ?? null);
  return frag;
}

type Component = (props: Record<string, unknown>) => Node;

/** JSX factory (`--jsxFactory h`). A component function runs exactly once. */
export function h(
  tag: string | Component | typeof Fragment,
  props: Props,
  ...children: Child[]
): Node {
  if (tag === Fragment) {
    const frag = document.createDocumentFragment();
    for (const c of children) appendChild(frag, c);
    return frag;
  }
  if (typeof tag === "function") {
    return (tag as Component)({ ...(props || {}), children });
  }
  const el = createEl(tag);
  if (props) applyProps(el, props as Record<string, unknown>);
  for (const c of children) appendChild(el, c);
  return el;
}

// ---------------------------------------------------------------------------
// Mounting
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dynamic regions (§7)
// ---------------------------------------------------------------------------

// Build `child` under `into` (a fresh, empty owner — each() passes its
// keyed subclass). The built top-level nodes land on `into.nodes`.
// A throw mid-build disposes the partial scope (its cleanups run) before
// propagating — no half-built ownership survives.
function buildScoped(into: Owner, build: () => Child): Owner {
  try {
    into.nodes = runInScope(into, () => {
      const built = build();
      // Fast path: a single element/text node (the common row/component
      // case) is stored as-is — no fragment, no NodeList copy, no array.
      if (
        built instanceof Node &&
        built.nodeType !== 11 /* DocumentFragment */
      ) {
        return built;
      }
      const frag = document.createDocumentFragment();
      appendChild(frag, built);
      return Array.from(frag.childNodes);
    });
  } catch (err) {
    into.dispose();
    throw err;
  }
  // the Owner IS the handle: no {nodes, dispose, flush} record + 2 closures
  return into;
}

// The two shapes of Owner.nodes, walked without allocating.
function insertNodes(parent: Node, ns: Node | Node[], ref: Node | null): void {
  if (Array.isArray(ns)) for (const n of ns) parent.insertBefore(n, ref);
  else parent.insertBefore(ns, ref);
}

function removeNodes(ns: Node | Node[]): void {
  if (Array.isArray(ns)) {
    for (const n of ns) if (n.parentNode) n.parentNode.removeChild(n);
  } else if (ns.parentNode) {
    ns.parentNode.removeChild(ns);
  }
}

function firstNode(ns: Node | Node[]): Node | null {
  return Array.isArray(ns) ? (ns[0] ?? null) : ns;
}

// Error-boundary channel over the ownership tree. `Catch` registers a
// handler on its children's scope; a dynamic region whose rebuild throws
// routes the error to the nearest handler up the chain (or rethrows).
const ERROR_HANDLER = Symbol("continuum.catch");

function lookupErrorHandler(
  scope: Scope | null,
): ((e: unknown) => void) | null {
  for (let s = scope; s; s = s.parent) {
    if (s instanceof Owner) {
      const h = s.contexts?.get(ERROR_HANDLER);
      if (h) return h as (e: unknown) => void;
    }
  }
  return null;
}

// A dynamic region's lifecycle must attach somewhere — unlike static JSX,
// which may live forever, a region REBUILDS and needs an owner to dispose
// replaced subtrees. Checked up front for a teaching error instead of an
// internal onCleanup() throw.
function needRegionOwner(what: string): void {
  if (!getScope()) {
    throw new Error(
      `Continuum: ${what} needs an owner — build it inside a component, ` +
        "mount(), or root().",
    );
  }
}

/** Conditional / switching subtree: rebuilds on each change of `b`. */
export function dyn<T>(b: State<T>, render: (v: T) => Child): Node {
  needRegionOwner("dyn()");
  const owner = getScope();
  const start = document.createComment("dyn");
  const end = document.createComment("/dyn");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  let current: Owner | null = null;
  // Level-triggered: render the behavior's CURRENT value, not the delivered
  // occurrence. A listener that runs earlier in the post phase may re-enter
  // with a new moment (e.g. a router redirect); the stale queued delivery
  // then must not clobber the newer render. Deduping by Object.is also makes
  // duplicate deliveries free.
  let hasRendered = false;
  let renderedValue: T;
  // Guards against a re-entrant update superseding this one mid-build: if
  // `render` itself fires a moment (an error boundary flipping its state),
  // the nested update finishes first and the outer one must discard its
  // now-stale build instead of clobbering the newer region.
  let epoch = 0;
  const update = () => {
    const v = b.sampleNoTrans();
    if (hasRendered && Object.is(renderedValue, v)) return;
    hasRendered = true;
    renderedValue = v;
    const myEpoch = ++epoch;
    if (current) {
      current.dispose();
      // Sweep the whole live range between the markers: a nested dynamic
      // region at the root of this one may have swapped nodes since build,
      // so the recorded node list can be stale.
      let n = start.nextSibling;
      while (n && n !== end) {
        const next = n.nextSibling;
        n.parentNode?.removeChild(n);
        n = next;
      }
    }
    let built: Owner;
    try {
      built = buildScoped(new Owner(owner), () => render(v));
    } catch (err) {
      // Route to the nearest error boundary; without one, keep the old
      // behavior (the error propagates out of the transaction).
      const handler = lookupErrorHandler(owner);
      if (!handler) throw err;
      handler(err); // opens a new moment; the boundary re-renders itself
      built = new Owner(null);
      built.nodes = [];
    }
    if (epoch !== myEpoch) {
      // A re-entrant update already rendered a newer value.
      built.dispose();
      return;
    }
    current = built;
    insertNodes(end.parentNode!, current.nodes!, end);
    // During the initial build the whole tree flushes at mount; afterwards
    // each freshly inserted subtree flushes here.
    if (!(owner instanceof Owner) || owner.mounted) current.flush();
  };

  bindState(b, update);
  onCleanup(() => current?.dispose());
  return frag;
}

// A list row IS its owner plus the reuse key — the {key, owner} wrapper
// record per row was pure overhead (10k of them at 10k rows).
class EachOwner<K> extends Owner {
  key: K;
  constructor(parent: Scope | null, key: K) {
    super(parent);
    this.key = key;
  }
}

/** Longest strictly-increasing subsequence; returns the set of kept indices. */
function lisIndices(seq: number[]): Set<number> {
  const n = seq.length;
  const piles: number[] = [];
  const prev: number[] = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const x = seq[i];
    if (x < 0) continue; // freshly-created rows are never "stable"
    let lo = 0;
    let hi = piles.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (seq[piles[mid]] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = piles[lo - 1];
    piles[lo] = i;
  }
  const keep = new Set<number>();
  let k = piles.length ? piles[piles.length - 1] : -1;
  while (k >= 0) {
    keep.add(k);
    k = prev[k];
  }
  return keep;
}

/** Keyed list: reuses rows by key, reorders with minimal moves (LIS). */
export function each<T, K>(
  items: State<T[]>,
  key: (item: T) => K,
  render: (item: T) => Child,
): Node {
  needRegionOwner("each()");
  const owner = getScope();
  const start = document.createComment("each");
  const end = document.createComment("/each");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  let rows: Array<EachOwner<K>> = [];

  const update = (list: T[]) => {
    const parent = end.parentNode!;
    const oldIndex = new Map<K, number>();
    rows.forEach((r, i) => oldIndex.set(r.key, i));

    const seen = new Set<K>();
    const next: Array<EachOwner<K>> = [];
    const seq: number[] = [];
    const freshFlushes: Owner[] = [];
    for (const item of list) {
      const k = key(item);
      if (seen.has(k)) continue; // duplicate keys: keep first
      seen.add(k);
      const prevIdx = oldIndex.get(k);
      if (prevIdx !== undefined) {
        next.push(rows[prevIdx]); // reuse: no re-render
        seq.push(prevIdx);
      } else {
        const built = new EachOwner(owner, k);
        buildScoped(built, () => render(item));
        next.push(built);
        seq.push(-1);
        freshFlushes.push(built);
      }
    }

    // dispose rows whose key disappeared
    for (const r of rows) {
      if (!seen.has(r.key)) {
        r.dispose();
        removeNodes(r.nodes!);
      }
    }

    // reorder with minimal moves; preserve focus across moves
    const doc = parent.ownerDocument || document;
    const active = doc.activeElement;
    const keep = lisIndices(seq);
    // Consecutive moved/fresh rows are batched into ONE DocumentFragment
    // insertion per run — creating 10k rows used to cost 10k insertBefore
    // calls into the live table (see benchmark/BASELINES.md).
    let anchor: Node = end;
    let batch: DocumentFragment | null = null;
    let batchAnchor: Node = end;
    for (let i = next.length - 1; i >= 0; i--) {
      const row = next[i];
      if (!keep.has(i)) {
        if (!batch) {
          batch = document.createDocumentFragment();
          batchAnchor = anchor;
        }
        // walking backwards: prepend to keep the row order
        const nodes = row.nodes!;
        if (Array.isArray(nodes)) {
          for (let j = nodes.length - 1; j >= 0; j--) {
            batch.insertBefore(nodes[j], batch.firstChild);
          }
        } else {
          batch.insertBefore(nodes, batch.firstChild);
        }
      } else if (batch) {
        parent.insertBefore(batch, batchAnchor);
        batch = null;
      }
      anchor = firstNode(row.nodes!) ?? anchor;
    }
    if (batch) parent.insertBefore(batch, batchAnchor);
    // Re-focus ONLY if a move actually stole it: an unconditional focus()
    // forces a synchronous style/layout pass on every list update and used
    // to push swap/remove past the frame budget (see benchmark/BASELINES.md).
    if (
      active instanceof HTMLElement &&
      doc.activeElement !== active &&
      active.isConnected
    ) {
      active.focus();
    }

    rows = next;
    if (!(owner instanceof Owner) || owner.mounted)
      for (const f of freshFlushes) f.flush();
  };

  bindState(items, update);
  onCleanup(() => {
    for (const r of rows) r.dispose();
  });
  return frag;
}

// ---------------------------------------------------------------------------
// Context (§10) — implicit environment over the owner tree.
// ---------------------------------------------------------------------------

/** A context handle: identity plus the value used when nothing was provided. */
export interface Context<T> {
  readonly id: symbol;
  readonly defaultValue: T;
}

/** Create a context. Provide with `provide`, read with `use`. */
export function createContext<T>(defaultValue: T): Context<T> {
  return { id: Symbol("context"), defaultValue };
}

/** Write a context value into the current owner. Throws outside any owner. */
export function provide<T>(ctx: Context<T>, value: T): void {
  needScope("provide()");
  const owner = currentOwner();
  if (!owner) {
    throw new Error(
      "provide() needs a dom owner (a component, mount(), or dom's root()) — " +
        "a bare frp scope carries no context.",
    );
  }
  (owner.contexts ??= new Map()).set(ctx.id, value);
}

/** Read the nearest provided value up the owner tree, else the default. */
export function use<T>(ctx: Context<T>): T {
  let o: Scope | null = getScope();
  while (o) {
    if (o instanceof Owner && o.contexts && o.contexts.has(ctx.id)) {
      return o.contexts.get(ctx.id) as T;
    }
    o = o.parent;
  }
  return ctx.defaultValue;
}

// ---------------------------------------------------------------------------
// Rendering helpers (§14 roadmap #9)
// ---------------------------------------------------------------------------

// A behavior that only emits updates when its value actually changes.
// The dedup memory is seeded with the current value, so re-emitting the
// initial value does not trigger a rebuild.
function dedupe<T>(b: State<T>): State<T> {
  const out = new Stream<T>(b.updates.rank + 1);
  let prev = b.sampleNoTrans();
  let stagedTx: unknown = null;
  let staged: T;
  // one commit closure per node, not per moment; commits at the boundary:
  // an aborted moment must not swallow the next legitimate rebuild (its
  // pair dies with the dropped queue), and a mid-moment wake resets
  // stagedTx, disarming a queued commit
  const commit = () => {
    if (stagedTx !== null) {
      prev = staged;
      stagedTx = null;
    }
  };
  out.source(b.updates, (t, a) => {
    if (!Object.is(prev, a)) {
      if (stagedTx !== t) {
        stagedTx = t;
        t.last(commit);
      }
      staged = a;
      out.send_(t, a);
    }
  });
  // waking reseeds from the live value, so a re-mount never rebuilds for
  // the value it just rendered
  out.onWake = () => {
    prev = b.sampleNoTrans();
    stagedTx = null;
  };
  return new State<T>(() => b.sampleNoTrans(), out);
}

/** Conditional region driven by a boolean behavior (no rebuild on same value). */
export function when(
  cond: State<boolean>,
  thenRender: () => Child,
  elseRender?: () => Child,
): Node {
  return dyn(dedupe(cond), (c) =>
    c ? thenRender() : elseRender ? elseRender() : null,
  );
}

/** Two-way binding props for a text input. Spread onto an `<input>`. */
export function bindInput(value: StateSource<string>): {
  value: State<string>;
  onInput: (e: globalThis.Event) => void;
};
export function bindInput(
  value: State<string>,
  set: (v: string) => void,
): { value: State<string>; onInput: (e: globalThis.Event) => void };
export function bindInput(
  value: State<string> | StateSource<string>,
  set?: (v: string) => void,
): { value: State<string>; onInput: (e: globalThis.Event) => void } {
  // a source state carries its own setter — one argument is enough
  const write = set ?? (value as StateSource<string>).set.bind(value);
  return {
    value,
    onInput: (e: globalThis.Event) =>
      write((e.target as HTMLInputElement).value),
  };
}

/** Render `child` into another node, cleaning up on dispose. */
export function portal(target: Node, child: Child): Node {
  needRegionOwner("portal()");
  const built = buildScoped(new Owner(getScope()), () => child);
  insertNodes(target, built.nodes!, null);
  onCleanup(() => {
    built.dispose();
    removeNodes(built.nodes!);
  });
  return document.createComment("portal");
}

/** Mount a view under a root owner. Returns an unmount function. */
export function mount(container: Node, view: () => Node): () => void {
  return root((dispose) => {
    const node = view();
    const nodes = node.nodeType === 11 ? Array.from(node.childNodes) : [node];
    container.appendChild(node);
    onCleanup(() => {
      for (const n of nodes) if (n.parentNode) n.parentNode.removeChild(n);
    });
    const s = getScope();
    if (s) flushMounts(s);
    return () => dispose();
  });
}

// ---------------------------------------------------------------------------
// Animation clock (browser) — a discrete tick source for continuous time.
// ---------------------------------------------------------------------------

/**
 * An `Stream<number>` of `requestAnimationFrame` timestamps (ms). Drives the
 * continuous-time combinators (`integral`/`derivative`/`warp` from the core).
 * Registered against the current owner: it stops automatically on unmount.
 */
export function animationFrames(): Stream<number> {
  const ticks = stream<number>();
  let raf = requestAnimationFrame(function loop(t) {
    ticks.fire(t);
    raf = requestAnimationFrame(loop);
  });
  onCleanup(() => cancelAnimationFrame(raf));
  return ticks;
}

// ---------------------------------------------------------------------------
// Control-flow components — JSX wrappers over the rendering helpers.
//
// The function/component pairing is a deliberate symmetry, not duplication:
//   when(b, then, else)  ↔  <Show when={b}>       — conditional region
//   dyn(b, render)       ↔  <Dynamic of={b}>      — switching subtree
//   each(b, by, render)  ↔  <Each of={b} by={..}> — keyed list
//   portal(target, ch)   ↔  <Portal mount={..}>   — render elsewhere
// Functions compose in plain code (no JSX required); components read better
// inside markup. Both call the same implementation.
// ---------------------------------------------------------------------------

// JSX always delivers children as the rest array; a single render function
// arrives as `[fn]`. Normalize to a render callback.
function asRender<T>(children: unknown): (value: T) => Child {
  const c = Array.isArray(children) ? children[0] : children;
  return typeof c === "function"
    ? (c as (value: T) => Child)
    : () => c as Child;
}

/**
 * Conditional region. Rebuilds only when the truthiness of `when` toggles; the
 * (narrowed) value is passed to the children render function at build time.
 *
 * ```tsx
 * <Show when={user} fallback={() => <Guest />}>
 *   {(u) => <span>{u.name}</span>}
 * </Show>
 * ```
 */
export function Show<T>(props: {
  when: State<T>;
  children: (value: NonNullable<T>) => Child;
  fallback?: () => Child;
}): Node {
  const render = asRender<NonNullable<T>>(props.children);
  const present = props.when.map((v) => !!v);
  return when(
    present,
    () => render(props.when.sample() as NonNullable<T>),
    props.fallback,
  );
}

/**
 * Keyed list. The `by` key selector defaults to identity. (Note: `key` is a
 * reserved JSX attribute stripped by the compiler, so the prop is named `by`.)
 *
 * ```tsx
 * <Each each={items} by={(i) => i.id}>{(item) => <li>{item.name}</li>}</Each>
 * ```
 */
export function Each<T, K = T>(props: {
  each: State<T[]>;
  by?: (item: T) => K;
  children: (item: T) => Child;
}): Node {
  const render = asRender<T>(props.children);
  const key = props.by ?? ((item: T) => item as unknown as K);
  return each(props.each, key, render);
}

/**
 * Switch the subtree on a behavior's value (rebuilds on every change).
 *
 * ```tsx
 * <Dynamic value={route}>{(r) => r === "home" ? <Home /> : <About />}</Dynamic>
 * ```
 */
export function Dynamic<T>(props: {
  value: State<T>;
  children: (value: T) => Child;
}): Node {
  return dyn(props.value, asRender<T>(props.children));
}

/**
 * Render children into another node (e.g. `document.body`), cleaning up on
 * unmount. Children are eager here — a portal renders immediately.
 *
 * ```tsx
 * <Portal mount={document.body}><Modal /></Portal>
 * ```
 */
export function Portal(props: { mount: Node; children?: Child }): Node {
  return portal(props.mount, props.children ?? null);
}

/**
 * Error boundary. Catches a throw while building its children and a throw
 * during any nested dynamic-region rebuild (`Show`/`Dynamic`/`dyn`), disposes
 * the failed subtree's ownership, and renders `fallback` instead. `reset`
 * re-renders the children from scratch.
 *
 * Children must be a thunk — eager JSX would run (and throw) before `Catch`
 * gets control:
 *
 * ```tsx
 * <Catch fallback={(e, reset) => <button onClick={reset}>retry</button>}>
 *   {() => <Risky />}
 * </Catch>
 * ```
 *
 * Not covered: throws inside binding `map` functions (keep them pure) and
 * inside `listen` effects. Async/IO errors never throw at all — `perform`
 * and `resource` deliver them as data. An error thrown by `fallback` itself
 * escalates to the next boundary up.
 */
export function Catch(props: {
  children: Child | (() => Child);
  fallback: (error: unknown, reset: () => void) => Child;
}): Node {
  const failure = state<{ error: unknown } | null>(null);
  const reset = () => failure.set(null);
  const build = asRender<void>(props.children);
  return dyn(failure, (f) => {
    if (f) return props.fallback(f.error, reset);
    // Handler for nested regions lives on the children's scope only — a
    // throw inside `fallback` must escalate to the boundary above, not loop.
    const owner = currentOwner();
    if (owner) {
      (owner.contexts ??= new Map()).set(ERROR_HANDLER, (error: unknown) =>
        failure.set({ error }),
      );
    }
    try {
      return build();
    } catch (error) {
      failure.set({ error }); // level-triggered dyn re-renders with the fallback
      return null;
    }
  });
}
