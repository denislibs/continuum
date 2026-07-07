// Continuum — DOM renderer (dom).
// Fine-grained rendering over the frp core: bindings, dynamic regions,
// keyed lists, an ownership tree for lifecycle, and context.

import { Behavior, Event, newBehavior, newEvent } from "@continuum-js/frp";
import type { Unlisten } from "@continuum-js/frp";

// ---------------------------------------------------------------------------
// Ownership tree (§9) — lifecycle, not dependency tracking.
// ---------------------------------------------------------------------------

interface Owner {
  cleanups: Array<() => void>;
  // Lazily allocated, like `contexts` — most owners never use `onMount`.
  mounts: Array<() => void> | null;
  mounted: boolean;
  children: Owner[];
  parent: Owner | null;
  // Lazily allocated — most owners never carry context, so we skip the Map
  // until `provide` writes one (hot path when building many rows).
  contexts: Map<symbol, unknown> | null;
  disposed: boolean;
}

let currentOwner: Owner | null = null;

function createOwner(parent: Owner | null): Owner {
  const owner: Owner = {
    cleanups: [],
    mounts: null,
    mounted: false,
    children: [],
    parent,
    contexts: null,
    disposed: false,
  };
  if (parent) parent.children.push(owner);
  return owner;
}

function disposeOwner(owner: Owner): void {
  if (owner.disposed) return;
  owner.disposed = true;
  // children first (reverse creation order), then this owner's cleanups.
  for (let i = owner.children.length - 1; i >= 0; i--) {
    disposeOwner(owner.children[i]);
  }
  owner.children.length = 0;
  for (let i = owner.cleanups.length - 1; i >= 0; i--) {
    owner.cleanups[i]();
  }
  owner.cleanups.length = 0;
  owner.mounts = null; // never mounted → its onMount callbacks never run
  // detach from parent
  if (owner.parent) {
    const siblings = owner.parent.children;
    const idx = siblings.indexOf(owner);
    if (idx >= 0) siblings.splice(idx, 1);
    owner.parent = null;
  }
}

function runUnder<T>(owner: Owner | null, fn: () => T): T {
  const prev = currentOwner;
  currentOwner = owner;
  try {
    return fn();
  } finally {
    currentOwner = prev;
  }
}

/** Root owner (a mount point). `fn` receives its dispose handle. */
export function root<T>(fn: (dispose: () => void) => T): T {
  const owner = createOwner(null);
  return runUnder(owner, () => fn(() => disposeOwner(owner)));
}

/** Child owner under the current one. Returns its value and dispose handle. */
export function scope<T>(fn: () => T): { value: T; dispose: () => void } {
  const owner = createOwner(currentOwner);
  const value = runUnder(owner, fn);
  return { value, dispose: () => disposeOwner(owner) };
}

// Lifecycle registrations need an owner; silently dropping them (the old
// behavior) meant cleanups that never ran. Loud beats silent-dead.
function needOwner(what: string): Owner {
  if (!currentOwner) {
    throw new Error(
      what +
        " was called outside a component/scope — there is no owner to " +
        "attach it to, so it would never run. Call it synchronously during " +
        "component build (or inside root()/scope()).",
    );
  }
  return currentOwner;
}

/** Register a cleanup in the current owner. Throws outside any owner. */
export function onCleanup(fn: () => void): void {
  needOwner("onCleanup()").cleanups.push(fn);
}

// Run the subtree's pending onMount callbacks: child scopes first, then this
// owner's own, newest registration first. With the idiomatic `onMount` at the
// top of a component body, that yields children-before-parents.
function flushMounts(owner: Owner): void {
  if (owner.disposed) return;
  for (const child of owner.children) flushMounts(child);
  owner.mounted = true;
  const mounts = owner.mounts;
  if (mounts) {
    owner.mounts = null;
    for (let i = mounts.length - 1; i >= 0; i--) mounts[i]();
  }
}

/**
 * Register a callback to run once the current scope's nodes are inserted into
 * the DOM — after `mount`, or right after a dynamic region (`dyn`/`each`)
 * inserts a freshly built subtree. Use it for focus, measurement, and
 * third-party libraries that need a live element. No-op outside any owner.
 */
export function onMount(fn: () => void): void {
  const owner = needOwner("onMount()");
  (owner.mounts ??= []).push(fn);
}

// Attach an frp subscription to the current owner's lifecycle. Deliberately
// NOT guarded: JSX built outside any owner (an unowned static fragment) has
// always been allowed — its bindings just live forever.
function bind(un: Unlisten): void {
  if (currentOwner) currentOwner.cleanups.push(un);
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
  | Behavior<unknown>
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

type Props = Record<string, unknown> | null;

function toText(v: unknown): string {
  return v == null ? "" : String(v);
}

function appendChild(parent: Node, child: Child): void {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    for (const c of child) appendChild(parent, c);
    return;
  }
  if (child instanceof Behavior) {
    // fine-grained: one text node bound to one behavior
    const text = document.createTextNode("");
    bind(child.listen((v) => (text.data = toText(v))));
    parent.appendChild(text);
    return;
  }
  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }
  parent.appendChild(document.createTextNode(String(child)));
}

function applyRef(ref: unknown, el: Element): void {
  if (typeof ref === "function") (ref as (el: Element) => void)(el);
  else if (ref && typeof ref === "object")
    (ref as { current: Element }).current = el;
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

function applyProps(el: Element, props: Record<string, unknown>): void {
  for (const key in props) {
    if (key === "children") continue;
    const value = props[key];
    if (key === "ref") {
      applyRef(value, el);
      continue;
    }
    if (key.length > 2 && key.startsWith("on")) {
      const evt = key.slice(2).toLowerCase();
      const handler = value as EventListener;
      el.addEventListener(evt, handler);
      bind(() => el.removeEventListener(evt, handler));
      continue;
    }
    if (value instanceof Behavior) {
      bind(value.listen((v) => setProp(el, key, v)));
      continue;
    }
    setProp(el, key, value);
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

// Build `child` into a fragment under a fresh scope of `owner`. Returns the
// fragment's top-level nodes, the scope's dispose handle, and a `flush` that
// runs the scope's pending onMount callbacks (call it after insertion).
// A throw mid-build disposes the partial scope (its cleanups run) before
// propagating — no half-built ownership survives.
function buildScoped(
  owner: Owner | null,
  build: () => Child,
): { nodes: Node[]; dispose: () => void; flush: () => void } {
  const scopeOwner = createOwner(owner);
  let nodes: Node[];
  try {
    nodes = runUnder(scopeOwner, () => {
      const built = build();
      // Fast path: a single element/text node (the common row/component case)
      // needs no fragment or NodeList copy.
      if (
        built instanceof Node &&
        built.nodeType !== 11 /* DocumentFragment */
      ) {
        return [built];
      }
      const frag = document.createDocumentFragment();
      appendChild(frag, built);
      return Array.from(frag.childNodes);
    });
  } catch (err) {
    disposeOwner(scopeOwner);
    throw err;
  }
  return {
    nodes,
    dispose: () => disposeOwner(scopeOwner),
    flush: () => flushMounts(scopeOwner),
  };
}

// Error-boundary channel over the ownership tree. `Catch` registers a
// handler on its children's scope; a dynamic region whose rebuild throws
// routes the error to the nearest handler up the chain (or rethrows).
const ERROR_HANDLER = Symbol("continuum.catch");

function lookupErrorHandler(
  owner: Owner | null,
): ((e: unknown) => void) | null {
  for (let o = owner; o; o = o.parent) {
    const h = o.contexts?.get(ERROR_HANDLER);
    if (h) return h as (e: unknown) => void;
  }
  return null;
}

/** Conditional / switching subtree: rebuilds on each change of `b`. */
export function dyn<T>(b: Behavior<T>, render: (v: T) => Child): Node {
  const owner = currentOwner;
  const start = document.createComment("dyn");
  const end = document.createComment("/dyn");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  let current: {
    nodes: Node[];
    dispose: () => void;
    flush: () => void;
  } | null = null;
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
    let built: { nodes: Node[]; dispose: () => void; flush: () => void };
    try {
      built = buildScoped(owner, () => render(v));
    } catch (err) {
      // Route to the nearest error boundary; without one, keep the old
      // behavior (the error propagates out of the transaction).
      const handler = lookupErrorHandler(owner);
      if (!handler) throw err;
      handler(err); // opens a new moment; the boundary re-renders itself
      built = { nodes: [], dispose: () => {}, flush: () => {} };
    }
    if (epoch !== myEpoch) {
      // A re-entrant update already rendered a newer value.
      built.dispose();
      return;
    }
    current = built;
    const parent = end.parentNode!;
    for (const n of current.nodes) parent.insertBefore(n, end);
    // During the initial build the whole tree flushes at mount; afterwards
    // each freshly inserted subtree flushes here.
    if (!owner || owner.mounted) current.flush();
  };

  bind(b.listen(update));
  onCleanup(() => current?.dispose());
  return frag;
}

interface Row<K> {
  key: K;
  nodes: Node[];
  dispose: () => void;
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
  items: Behavior<T[]>,
  key: (item: T) => K,
  render: (item: T) => Child,
): Node {
  const owner = currentOwner;
  const start = document.createComment("each");
  const end = document.createComment("/each");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  let rows: Array<Row<K>> = [];

  const update = (list: T[]) => {
    const parent = end.parentNode!;
    const oldIndex = new Map<K, number>();
    rows.forEach((r, i) => oldIndex.set(r.key, i));

    const seen = new Set<K>();
    const next: Array<Row<K>> = [];
    const seq: number[] = [];
    const freshFlushes: Array<() => void> = [];
    for (const item of list) {
      const k = key(item);
      if (seen.has(k)) continue; // duplicate keys: keep first
      seen.add(k);
      const prevIdx = oldIndex.get(k);
      if (prevIdx !== undefined) {
        next.push(rows[prevIdx]); // reuse: no re-render
        seq.push(prevIdx);
      } else {
        const built = buildScoped(owner, () => render(item));
        next.push({ key: k, nodes: built.nodes, dispose: built.dispose });
        seq.push(-1);
        freshFlushes.push(built.flush);
      }
    }

    // dispose rows whose key disappeared
    for (const r of rows) {
      if (!seen.has(r.key)) {
        r.dispose();
        for (const n of r.nodes) if (n.parentNode) n.parentNode.removeChild(n);
      }
    }

    // reorder with minimal moves; preserve focus across moves
    const active = (parent.ownerDocument || document).activeElement;
    const keep = lisIndices(seq);
    let anchor: Node = end;
    for (let i = next.length - 1; i >= 0; i--) {
      const row = next[i];
      if (!keep.has(i)) {
        for (const n of row.nodes) parent.insertBefore(n, anchor);
      }
      anchor = row.nodes[0] ?? anchor;
    }
    if (active instanceof HTMLElement && active.isConnected) active.focus();

    rows = next;
    if (!owner || owner.mounted) for (const f of freshFlushes) f();
  };

  bind(items.listen(update));
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
  const owner = needOwner("provide()");
  (owner.contexts ??= new Map()).set(ctx.id, value);
}

/** Read the nearest provided value up the owner tree, else the default. */
export function use<T>(ctx: Context<T>): T {
  let o = currentOwner;
  while (o) {
    if (o.contexts && o.contexts.has(ctx.id)) {
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
function distinctB<T>(b: Behavior<T>): Behavior<T> {
  const out = new Event<T>(b.updates.rank + 1);
  let prev = b.sampleNoTrans();
  b.updates.listen_(out, (t, a) => {
    if (!Object.is(prev, a)) {
      prev = a;
      out.send_(t, a);
    }
  });
  return new Behavior<T>(() => b.sampleNoTrans(), out);
}

/** Conditional region driven by a boolean behavior (no rebuild on same value). */
export function when(
  cond: Behavior<boolean>,
  thenRender: () => Child,
  elseRender?: () => Child,
): Node {
  return dyn(distinctB(cond), (c) =>
    c ? thenRender() : elseRender ? elseRender() : null,
  );
}

/** Two-way binding props for a text input. Spread onto an `<input>`. */
export function bindInput(
  value: Behavior<string>,
  set: (v: string) => void,
): { value: Behavior<string>; onInput: (e: globalThis.Event) => void } {
  return {
    value,
    onInput: (e: globalThis.Event) => set((e.target as HTMLInputElement).value),
  };
}

/** Render `child` into another node, cleaning up on dispose. */
export function portal(target: Node, child: Child): Node {
  const built = buildScoped(currentOwner, () => child);
  for (const n of built.nodes) target.appendChild(n);
  onCleanup(() => {
    built.dispose();
    for (const n of built.nodes) if (n.parentNode) n.parentNode.removeChild(n);
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
    if (currentOwner) flushMounts(currentOwner);
    return () => dispose();
  });
}

// ---------------------------------------------------------------------------
// Animation clock (browser) — a discrete tick source for continuous time.
// ---------------------------------------------------------------------------

/**
 * An `Event<number>` of `requestAnimationFrame` timestamps (ms). Drives the
 * continuous-time combinators (`integral`/`derivative`/`warp` from the core).
 * Registered against the current owner: it stops automatically on unmount.
 */
export function animationFrames(): Event<number> {
  const [ticks, fire] = newEvent<number>();
  let raf = requestAnimationFrame(function loop(t) {
    fire(t);
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
  when: Behavior<T>;
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
  each: Behavior<T[]>;
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
  value: Behavior<T>;
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
  const [failure, setFailure] = newBehavior<{ error: unknown } | null>(null);
  const reset = () => setFailure(null);
  const build = asRender<void>(props.children);
  return dyn(failure, (f) => {
    if (f) return props.fallback(f.error, reset);
    // Handler for nested regions lives on the children's scope only — a
    // throw inside `fallback` must escalate to the boundary above, not loop.
    if (currentOwner) {
      (currentOwner.contexts ??= new Map()).set(
        ERROR_HANDLER,
        (error: unknown) => setFailure({ error }),
      );
    }
    try {
      return build();
    } catch (error) {
      setFailure({ error }); // level-triggered dyn re-renders with the fallback
      return null;
    }
  });
}
