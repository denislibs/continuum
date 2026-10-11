import { mount } from "@continuum-js/dom";
import { App } from "./App.js";

mount(document.getElementById("app")!, () => <App />);

// Dev-only: strict layout mode (reads inside effects are reported) and the
// live counters overlay. Vite drops this branch from production builds.
if (import.meta.env.DEV) {
  void import("@continuum-js/devtools").then(({ installDevtools }) =>
    installDevtools(),
  );
}
