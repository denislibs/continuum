import { describe, test, expect } from "vitest";
import { state } from "@continuum-js/frp";
import { persist, loadPersisted } from "@continuum-js/std";

// A minimal in-memory Storage double — persistence must be testable without
// touching the real localStorage.
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("loadPersisted", () => {
  test("returns the fallback when the key is missing", () => {
    expect(loadPersisted("todos", [], memoryStorage())).toEqual([]);
  });

  test("returns the parsed value when present", () => {
    const s = memoryStorage({ todos: JSON.stringify([{ id: "1" }]) });
    expect(loadPersisted("todos", [], s)).toEqual([{ id: "1" }]);
  });

  test("returns the fallback on corrupted JSON instead of throwing", () => {
    const s = memoryStorage({ todos: "{oops" });
    expect(loadPersisted("todos", "fallback", s)).toBe("fallback");
  });

  test("returns the fallback when storage is unavailable (SSR)", () => {
    expect(loadPersisted("todos", 42, undefined)).toBe(42);
  });
});

describe("persist", () => {
  test("writes the current value immediately and on every update", () => {
    const s = memoryStorage();
    const b = state(1);
    const set = b.set;
    const un = persist("n", b, s);

    expect(s.data.get("n")).toBe("1"); // initial delivery
    set(2);
    expect(s.data.get("n")).toBe("2");
    un();
  });

  test("the returned unlisten stops the writes", () => {
    const s = memoryStorage();
    const b = state(1);
    const set = b.set;
    const un = persist("n", b, s);
    un();
    set(99);
    expect(s.data.get("n")).toBe("1"); // frozen at the last pre-unlisten write
  });

  test("is a no-op without storage (SSR) and still returns an unlisten", () => {
    const b = state(1);
    const un = persist("n", b, undefined);
    expect(typeof un).toBe("function");
    un(); // must not throw
  });

  test("a throwing setItem (quota exceeded) does not break the network", () => {
    const s = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const b = state(1);
    const set = b.set;
    const un = persist("n", b, s);
    expect(() => set(2)).not.toThrow(); // persistence is best-effort
    expect(b.sample()).toBe(2); // the value itself still updated
    un();
  });
});
