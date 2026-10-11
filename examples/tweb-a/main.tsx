import { mount } from "@continuum-js/dom";
import { App } from "./app.js";
import { createMockApi } from "./mock.js";

const api = createMockApi();
api.start(120); // a stream of edits, reactions and new messages

mount(document.getElementById("app")!, () => <App api={api} />);

if (import.meta.env.DEV) {
  void import("@continuum-js/devtools").then(({ installDevtools }) =>
    installDevtools({ onViolation: (e) => console.error(e) }),
  );
}
