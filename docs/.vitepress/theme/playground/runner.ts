// Builds the sandboxed iframe document that runs playground code. The import
// map is embedded first (maps must be parsed before any module loads), then a
// harness module that: receives transpiled ESM over postMessage, imports it
// as a blob (bare @continuum-js/* specifiers resolve through the map), mounts
// its default export, and forwards console output and errors to the parent.
//
// buildRunnerHtml is pure so it can be unit-tested; the UI turns the string
// into an iframe srcdoc.

const HARNESS = /* js */ `
  const app = document.getElementById("app");
  const send = (msg) => parent.postMessage(msg, "*");

  for (const level of ["log", "info", "warn", "error"]) {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      send({ type: "console", level, text: args.map(fmt).join(" ") });
    };
  }
  function fmt(v) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  window.addEventListener("error", (e) =>
    send({ type: "error", message: String(e.error?.stack || e.message) }));
  window.addEventListener("unhandledrejection", (e) =>
    send({ type: "error", message: String(e.reason?.stack || e.reason) }));

  let disposer = null;
  window.addEventListener("message", async (e) => {
    if (e.data?.type !== "run") return;
    if (disposer) { try { disposer(); } catch {} disposer = null; }
    app.replaceChildren();
    send({ type: "clear" });
    try {
      const blob = new Blob([e.data.code], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const mod = await import(url);
      URL.revokeObjectURL(url);
      const view = mod.default;
      if (typeof view === "function") {
        const { mount } = await import("@continuum-js/dom");
        disposer = mount(app, view);
      } else if (view != null) {
        app.textContent = fmt(view);
      }
      send({ type: "ok" });
    } catch (err) {
      send({ type: "error", message: String(err?.stack || err) });
    }
  });

  send({ type: "ready" });
`;

export function buildRunnerHtml(importMap: Record<string, string>): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script type="importmap">
${JSON.stringify({ imports: importMap }, null, 2)}
</script>
<style>
  html, body { margin: 0; padding: 0; font: 14px/1.5 system-ui, sans-serif; }
  #app { padding: 16px; }
</style>
</head>
<body>
<div id="app"></div>
<script type="module">${HARNESS}</script>
</body>
</html>`;
}
