import { describe, test, expect, vi, afterEach } from "vitest";
import { newEvent } from "@continuum-js/frp";
import { debounce, throttle, delay, interval } from "@continuum-js/std";

describe("time combinators", () => {
  afterEach(() => vi.useRealTimers());

  test("debounce coalesces a burst into the trailing value", () => {
    vi.useFakeTimers();
    const [e, fire] = newEvent<string>();
    const seen: string[] = [];
    debounce(e, 200).listen((v) => seen.push(v));

    fire("a");
    fire("ab");
    fire("abc");
    vi.advanceTimersByTime(199);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["abc"]);
  });

  test("throttle emits the leading occurrence then ignores for the window", () => {
    vi.useFakeTimers();
    const [e, fire] = newEvent<number>();
    const seen: number[] = [];
    throttle(e, 100).listen((v) => seen.push(v));

    fire(1); // leading — passes
    fire(2); // within window — dropped
    fire(3); // within window — dropped
    expect(seen).toEqual([1]);

    vi.advanceTimersByTime(100);
    fire(4); // window elapsed — passes
    expect(seen).toEqual([1, 4]);
  });

  test("delay shifts each occurrence later by ms", () => {
    vi.useFakeTimers();
    const [e, fire] = newEvent<string>();
    const seen: string[] = [];
    delay(e, 50).listen((v) => seen.push(v));

    fire("x");
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(50);
    expect(seen).toEqual(["x"]);
  });

  test("interval emits an increasing counter and stops on dispose", () => {
    vi.useFakeTimers();
    const ticks = interval(10);
    const seen: number[] = [];
    ticks.listen((n) => seen.push(n));

    vi.advanceTimersByTime(35);
    expect(seen).toEqual([1, 2, 3]);

    ticks.dispose();
    vi.advanceTimersByTime(50);
    expect(seen).toEqual([1, 2, 3]); // no more ticks after dispose
  });
});
