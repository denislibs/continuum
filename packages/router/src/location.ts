// The URL as a first-class FRP value: `location()` is a Wire<URL>,
// `navigate` is the event input. One lazily-created singleton per page —
// created on first use so importing the module has no side effects.

import { wire, type WireSource, type Wire } from "@continuum-js/frp";

let loc: WireSource<URL> | null = null;

function ensure(): WireSource<URL> {
  if (!loc) {
    const l = wire(new URL(window.location.href));
    // Back/forward: the browser moves through history, we follow.
    window.addEventListener("popstate", () =>
      l.set(new URL(window.location.href)),
    );
    loc = l;
  }
  return loc;
}

/** The current URL across time. Updates on `navigate` and popstate. */
export function location(): Wire<URL> {
  return ensure();
}

/** Programmatic navigation (History API push, or replace with `{ replace }`). */
export function navigate(to: string, opts?: { replace?: boolean }): void {
  ensure();
  const url = new URL(to, window.location.href);
  if (opts?.replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  ensure().set(url);
  if (!opts?.replace) {
    // Scroll to top on forward navigation (browser restores it on popstate).
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
}
