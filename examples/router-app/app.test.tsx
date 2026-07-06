import { test, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, click } from "@continuum-js/test";
import { navigate } from "@continuum-js/router";
import { App } from "./app.js";

beforeEach(() => navigate("/", { replace: true }));
afterEach(() => cleanup());

test("navigates through the app: index, params, lazy chunk, guard, 404", async () => {
  const { container } = render(() => <App />);
  expect(container.textContent).toContain("index route");

  // nested layout + reactive params
  navigate("/users/1");
  expect(container.textContent).toContain("User 1");
  navigate("/users/2");
  expect(container.textContent).toContain("User 2");
  expect(container.textContent).toContain("built 1×"); // no rebuild

  // lazy page resolves after the chunk "arrives"
  const about = Array.from(container.querySelectorAll("a")).find(
    (a) => a.textContent === "About (lazy)",
  )!;
  click(about);
  // a real dynamic import resolves in a macrotask (vite transforms the chunk)
  await vi.waitFor(() => expect(container.textContent).toContain("own chunk"));

  // guard redirect
  navigate("/admin");
  expect(window.location.pathname).toBe("/about");

  // 404
  navigate("/no/such/page");
  expect(container.textContent).toContain("404");
});
