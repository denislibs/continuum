// Continuum devtools — dev-only. Strict layout mode enforces law 3 ("layout
// is an effect": no layout reads inside effects) at runtime, the way the
// core's purity guard enforces law 1; the overlay shows the engine's live
// counters so leaks and churn are visible.

import { inEffectZone, setDevHooks } from "@continuum-js/frp";
import { LAYOUT_CAUSES } from "./layoutCauses.js";
import { createOverlay, type Counters } from "./overlay.js";

export { LAYOUT_CAUSES };

export interface DevtoolsOptions {
  /** Patch layout getters/methods to report reads inside effects. Default true. */
  strictLayout?: boolean;
  /** Show the live counters panel. Default true. */
  overlay?: boolean;
  /** What to do with a violation. Default: throw (it surfaces from the frame pass). */
  onViolation?: (error: Error) => void;
}

let installed: (() => void) | null = null;

/**
 * Install strict layout mode and/or the overlay. Returns the uninstall
 * function; a second call while installed returns the same one.
 */
export function installDevtools(opts: DevtoolsOptions = {}): () => void {
  if (installed) return installed;
  const counters: Counters = {
    scopes: 0,
    subscriptions: 0,
    moments: 0,
    violations: 0,
  };
  const onViolation =
    opts.onViolation ??
    ((e: Error) => {
      throw e;
    });
  const violate = (name: string) => {
    counters.violations++;
    onViolation(
      new Error(
        `Continuum devtools: layout read \`${name}\` inside an effect ` +
          "(listen/onMount/perform). Effects run after the renderer's " +
          "writes, so this forces a reflow. Read through measure(trigger, fn) " +
          "or createSize/createScroll, or wrap an intentional read in " +
          "forceMeasure(() => …).",
      ),
    );
  };

  const restores: Array<() => void> = [];
  if (opts.strictLayout ?? true) {
    const g = globalThis as unknown as Record<string, unknown>;
    for (const [entity, causes] of Object.entries(LAYOUT_CAUSES)) {
      const target = g[entity];
      if (!target) continue;
      const proto = (
        typeof target === "object"
          ? target
          : (target as { prototype?: unknown }).prototype
      ) as Record<string, unknown> | undefined;
      if (!proto) continue;
      for (const prop of causes.props) {
        const d = Object.getOwnPropertyDescriptor(proto, prop);
        const get = d?.get;
        if (!get) continue;
        Object.defineProperty(proto, prop, {
          ...d,
          get() {
            if (inEffectZone()) violate(prop);
            return get.call(this);
          },
        });
        restores.push(() => Object.defineProperty(proto, prop, d));
      }
      for (const method of causes.methods) {
        const orig = proto[method];
        if (typeof orig !== "function") continue;
        proto[method] = function (this: unknown, ...args: unknown[]) {
          if (inEffectZone()) violate(method + "()");
          return (orig as (...a: unknown[]) => unknown).apply(this, args);
        };
        restores.push(() => {
          proto[method] = orig;
        });
      }
    }
  }

  setDevHooks({
    scope: (d) => (counters.scopes += d),
    edge: (d) => (counters.subscriptions += d),
    moment: () => counters.moments++,
  });
  restores.push(() => setDevHooks(null));

  if (opts.overlay ?? true) restores.push(createOverlay(counters));

  installed = () => {
    for (let i = restores.length - 1; i >= 0; i--) restores[i]();
    installed = null;
  };
  return installed;
}
