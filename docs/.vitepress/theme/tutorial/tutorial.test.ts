import { describe, test, expect } from "vitest";
import { tracks } from "./tracks";

// Data-integrity for the tutorial content. The BEHAVIORAL guarantee — every
// solution passes its check and every starter fails it — runs against the
// real compile→iframe pipeline in the Playwright e2e (tutorial.e2e), which is
// where checks actually execute. Here we lock the shape so a malformed step
// can never ship.

describe("tutorial tracks", () => {
  test("at least one track, each with steps", () => {
    expect(tracks.length).toBeGreaterThan(0);
    for (const t of tracks) expect(t.steps.length).toBeGreaterThan(0);
  });

  test("track and step ids are unique", () => {
    const trackIds = tracks.map((t) => t.id);
    expect(new Set(trackIds).size).toBe(trackIds.length);
    for (const t of tracks) {
      const ids = t.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${t.id}`).toBe(ids.length);
    }
  });

  test("every step is fully formed", () => {
    for (const t of tracks) {
      for (const s of t.steps) {
        expect(s.title, `${t.id}/${s.id} title`).toBeTruthy();
        expect(s.task, `${t.id}/${s.id} task`).toBeTruthy();
        expect(s.starter, `${t.id}/${s.id} starter`).toBeTruthy();
        expect(s.solution, `${t.id}/${s.id} solution`).toBeTruthy();
        expect(typeof s.check, `${t.id}/${s.id} check`).toBe("function");
        // starter must differ from solution or there's nothing to do
        expect(s.starter, `${t.id}/${s.id} starter==solution`).not.toBe(
          s.solution,
        );
      }
    }
  });

  test("checks are closure-free (destructure a single ctx arg)", () => {
    // The iframe evals check.toString(); a closure over module scope would be
    // undefined there. Cheap guard: the source must open with a destructuring
    // arrow param, i.e. reference only ctx.
    for (const t of tracks) {
      for (const s of t.steps) {
        const src = s.check.toString();
        expect(src, `${t.id}/${s.id} check must destructure ctx`).toMatch(
          /^\s*(async\s*)?\(\s*\{/,
        );
      }
    }
  });
});
