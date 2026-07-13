// Pure path matching — no DOM, no history. `matchChain` turns a pathname into
// the chain of matched route definitions (layout → … → leaf) with params.

import type { Child } from "@continuum-js/dom";

/** Extracted path parameters (`:id` segments and the `*` rest). */
export type Params = Record<string, string>;

// Path segments arrive percent-encoded (they come from URL.pathname). Params
// should be the human-readable value: `/users/John%20Doe` -> `"John Doe"`.
// Malformed encodings (a lone `%`) throw URIError — fall back to the raw
// segment rather than blowing up the whole match.
function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** A route component. Parameters are read reactively via `useParams()`. */
export type Component = () => Child;

export interface RouteDef {
  /**
   * Path relative to the parent: `""` (index), `"users"`, `":id"`,
   * `"docs/api"`, or `"*"` (catch-all, rest available as `params["*"]`).
   */
  path: string;
  /** What to render. A layout without content may omit it (children render through). */
  component?: Component;
  /** Nested routes, rendered into the parent's `<Outlet>`. */
  children?: RouteDef[];
  /**
   * Pure guard: return `true` to pass or a path to redirect to
   * (applied with `replace`, so the guarded URL doesn't pollute history).
   */
  guard?: (params: Params) => true | string;
}

export interface MatchEntry {
  def: RouteDef;
  /** Own params merged with every ancestor's. */
  params: Params;
}

export type MatchResult = { chain: MatchEntry[] } | { redirect: string } | null;

/** Match `pathname` against the route tree. First match wins (order matters). */
export function matchChain(routes: RouteDef[], pathname: string): MatchResult {
  const segments = pathname.split("/").filter((s) => s !== "");
  const chain = matchLevel(routes, segments, {});
  if (!chain) return null;
  for (const e of chain) {
    if (e.def.guard) {
      const verdict = e.def.guard(e.params);
      if (verdict !== true) return { redirect: verdict };
    }
  }
  return { chain };
}

function matchLevel(
  defs: RouteDef[],
  segs: string[],
  inherited: Params,
): MatchEntry[] | null {
  for (const def of defs) {
    if (def.path === "*") {
      return [
        {
          def,
          params: { ...inherited, "*": segs.map(decodeSegment).join("/") },
        },
      ];
    }
    const own = def.path.split("/").filter((s) => s !== "");
    if (own.length > segs.length) continue;

    const params: Params = { ...inherited };
    let ok = true;
    for (let i = 0; i < own.length; i++) {
      if (own[i].startsWith(":"))
        params[own[i].slice(1)] = decodeSegment(segs[i]);
      else if (own[i] !== segs[i]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const rest = segs.slice(own.length);
    if (def.children) {
      const sub = matchLevel(def.children, rest, params);
      if (sub) return [{ def, params }, ...sub];
      continue; // children didn't match — try the next sibling
    }
    if (rest.length === 0) return [{ def, params }];
  }
  return null;
}
