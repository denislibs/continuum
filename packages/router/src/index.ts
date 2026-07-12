// Continuum router — the URL is a State, a route change is a change of a
// dynamic region. Nesting renders through <Outlet>; ownership destroys the
// subtree of the page you leave.

import { constant, state, type State } from "@continuum-js/frp";
import {
  h,
  dyn,
  createContext,
  provide,
  use,
  onCleanup,
  type Child,
} from "@continuum-js/dom";
import { distinctB } from "@continuum-js/std";
import {
  matchChain,
  type MatchEntry,
  type Params,
  type RouteDef,
  type Component,
} from "./match.js";
import { location, navigate } from "./location.js";

export { location, navigate } from "./location.js";
export { matchChain } from "./match.js";
export type { RouteDef, Params, Component, MatchEntry } from "./match.js";

interface RouterCtx {
  chain: State<MatchEntry[] | null>;
  depth: number;
}

const RouterContext = createContext<RouterCtx | null>(null);

const shallowEq = (a: Params, b: Params): boolean => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

/**
 * Render one depth of the matched chain. The dynamic region is keyed by the
 * route definition's IDENTITY: navigating between URLs of the same route
 * (e.g. /users/1 → /users/2) does not rebuild the subtree — only the params
 * behavior updates (the fine-grained promise, applied to routing).
 */
function renderLevel(
  chain: State<MatchEntry[] | null>,
  depth: number,
  fallback?: () => Child,
): Node {
  const defAt = distinctB(
    chain.map((c) => (c ? (c[depth]?.def ?? null) : null)),
  );
  return dyn(defAt, (def) => {
    if (!def) return chainOrNull(chain, fallback);
    provide(RouterContext, { chain, depth });
    // A pathless layout (no component) lets its children render through.
    return def.component ? def.component() : renderLevel(chain, depth + 1);
  });
}

// `null` at depth 0 means "nothing matched" → fallback; deeper it just means
// the chain is shorter than the outlet nesting → render nothing.
function chainOrNull(
  chain: State<MatchEntry[] | null>,
  fallback?: () => Child,
): Child {
  return fallback && chain.sampleNoTrans() === null ? fallback() : null;
}

/**
 * Route the current URL through `routes`. `fallback` renders when nothing
 * matches (404). A guard returning a path triggers a replace-navigation.
 */
export function Router(props: {
  routes: RouteDef[];
  fallback?: () => Child;
}): Node {
  const matched = location().map((u) => matchChain(props.routes, u.pathname));
  // Redirects are effects: observed after the moment closes, replace-navigated.
  onCleanup(
    matched.listen((m) => {
      if (m && "redirect" in m) navigate(m.redirect, { replace: true });
    }),
  );
  const chain = matched.map((m) => (m && "chain" in m ? m.chain : null));
  return renderLevel(chain, 0, props.fallback);
}

/** Render the next matched level (the child route) inside a layout. */
export function Outlet(): Node {
  const ctx = use(RouterContext);
  if (!ctx) throw new Error("continuum-router: <Outlet> outside <Router>");
  return renderLevel(ctx.chain, ctx.depth + 1);
}

/**
 * Path parameters of the current route as a behavior (own + ancestors'
 * merged). Updates in place on same-route navigation — no rebuild.
 */
export function useParams(): State<Params> {
  const ctx = use(RouterContext);
  if (!ctx) return constant({});
  const d = ctx.depth;
  return distinctB(
    ctx.chain.map((c) => (c ? (c[d]?.params ?? {}) : {})),
    shallowEq,
  );
}

/**
 * Client-side link: intercepts plain left clicks into `navigate`, carries an
 * `active` class (exact for `/`, prefix otherwise; `end` forces exact).
 */
export function Link(props: {
  href: string;
  children?: Child;
  end?: boolean;
  class?: string;
  activeClass?: string;
}): Node {
  const exact = props.end || props.href === "/";
  const active = location().map((u) =>
    exact
      ? u.pathname === props.href
      : u.pathname === props.href || u.pathname.startsWith(props.href + "/"),
  );
  const cls = active.map((a) =>
    [props.class, a ? (props.activeClass ?? "active") : ""]
      .filter(Boolean)
      .join(" "),
  );
  return h(
    "a",
    {
      href: props.href,
      class: cls,
      onClick: (e: MouseEvent) => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(props.href);
      },
    },
    props.children,
  );
}

/**
 * Code-split page: `loader` MUST be a thunk with a literal dynamic import —
 * `lazy(() => import("./Page"))` — so the bundler emits a separate chunk.
 * The loader runs on first visit; the module is cached forever after.
 * Loading shows `fallback`, a failed chunk shows `error`.
 */
export function lazy(
  loader: () => Promise<{ default: Component } | Component>,
  opts?: { fallback?: () => Child; error?: (e: unknown) => Child },
): Component {
  let cached: Component | null = null;
  return () => {
    if (cached) return cached();
    type LoadState = { ok?: Component; err?: unknown } | null;
    const status = state<LoadState>(null);
    loader().then(
      (m) => {
        cached = (m as { default?: Component }).default ?? (m as Component);
        status.set({ ok: cached });
      },
      (err) => status.set({ err }),
    );
    return dyn(status, (s) => {
      if (!s) return opts?.fallback ? opts.fallback() : null;
      if (s.ok) return s.ok();
      return opts?.error ? opts.error(s.err) : null;
    });
  };
}
