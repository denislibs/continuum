import { describe, test, expect, beforeEach } from "vitest";
import {
  loadProgress,
  markComplete,
  isComplete,
  trackPercent,
} from "./progress";

beforeEach(() => localStorage.clear());

describe("tutorial progress", () => {
  test("starts empty", () => {
    expect(loadProgress()).toEqual({});
    expect(isComplete("basics", "s1")).toBe(false);
  });

  test("marks a step complete and persists it", () => {
    markComplete("basics", "s1");
    expect(isComplete("basics", "s1")).toBe(true);
    // survives a fresh read (localStorage-backed)
    expect(loadProgress().basics).toContain("s1");
  });

  test("does not duplicate a step marked twice", () => {
    markComplete("basics", "s1");
    markComplete("basics", "s1");
    expect(loadProgress().basics).toEqual(["s1"]);
  });

  test("computes track completion percent", () => {
    const track = { id: "basics", steps: ["s1", "s2", "s3", "s4"] };
    expect(trackPercent(track)).toBe(0);
    markComplete("basics", "s1");
    markComplete("basics", "s2");
    expect(trackPercent(track)).toBe(50);
  });

  test("tolerates corrupt storage", () => {
    localStorage.setItem("continuum-tutorial-progress", "{not json");
    expect(loadProgress()).toEqual({});
  });
});
