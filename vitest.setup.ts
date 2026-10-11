// Every test ends with the frame pass drained, so pending observers of one
// test never run (or throw) inside the next.
import { afterEach } from "vitest";
import { flushFrame } from "@continuum-js/frp";

afterEach(() => {
  try {
    flushFrame();
  } catch {
    // a test that left a throwing observer pending already made its point
  }
});
