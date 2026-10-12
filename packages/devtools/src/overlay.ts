// A corner panel with the live engine counters, refreshed on a throttle.
// textContent only — nothing here is markup.

export interface Counters {
  scopes: number;
  subscriptions: number;
  moments: number;
  violations: number;
}

const REFRESH_MS = 500;

export function createOverlay(counters: Counters): () => void {
  const panel = document.createElement("div");
  panel.setAttribute("data-continuum-devtools", "");
  panel.style.cssText =
    "position:fixed;left:8px;bottom:8px;z-index:2147483647;min-width:180px;" +
    "padding:6px 8px;border:1px solid #888;border-radius:4px;" +
    "background:rgba(255,255,255,.92);color:#111;font:11px/1.5 ui-monospace,monospace;" +
    "white-space:pre;pointer-events:auto";
  const text = document.createElement("div");
  const reset = document.createElement("button");
  reset.textContent = "reset";
  reset.style.cssText = "margin-top:4px;font:inherit;cursor:pointer";
  panel.append(text, reset);

  let lastMoments = counters.moments;
  let lastAt = performance.now();
  let perSecond = 0;
  const render = () => {
    const now = performance.now();
    const dt = (now - lastAt) / 1000;
    if (dt > 0) perSecond = Math.round((counters.moments - lastMoments) / dt);
    lastMoments = counters.moments;
    lastAt = now;
    text.textContent =
      `scopes         ${counters.scopes}\n` +
      `subscriptions  ${counters.subscriptions}\n` +
      `moments/s      ${perSecond}\n` +
      `violations     ${counters.violations}`;
  };
  reset.addEventListener("click", () => {
    counters.violations = 0;
    render();
  });
  render();
  const timer = setInterval(render, REFRESH_MS);
  (document.body ?? document.documentElement).appendChild(panel);
  return () => {
    clearInterval(timer);
    panel.remove();
  };
}
