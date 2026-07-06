import { describe, test, expect } from "vitest";
import { newEvent, newBehavior, constant } from "@continuum-js/frp";
import { integral, derivative, warp } from "@continuum-js/frp";

describe("integral", () => {
  test("accumulates value * dt over a tick clock", () => {
    const [tick, fire] = newEvent<number>(); // timestamps (ms)
    const x = integral(constant(2), tick, 0); // constant velocity 2/ms
    expect(x.sample()).toBe(0);
    fire(0); // baseline
    expect(x.sample()).toBe(0);
    fire(10); // dt=10 -> +20
    expect(x.sample()).toBe(20);
    fire(15); // dt=5 -> +10
    expect(x.sample()).toBe(30);
  });

  test("integrates a changing behavior (forward Euler)", () => {
    const [tick, fire] = newEvent<number>();
    const [v, setV] = newBehavior(1);
    const x = integral(v, tick, 0);
    fire(0);
    fire(10); // v=1, dt=10 -> +10
    expect(x.sample()).toBe(10);
    setV(3);
    fire(20); // v=3, dt=10 -> +30
    expect(x.sample()).toBe(40);
  });
});

describe("derivative", () => {
  test("computes (dvalue / dt) over ticks", () => {
    const [tick, fire] = newEvent<number>();
    const [pos, setPos] = newBehavior(0);
    const d = derivative(pos, tick);
    fire(0); // baseline
    setPos(10);
    fire(10); // (10-0)/10 = 1
    expect(d.sample()).toBe(1);
    fire(20); // (10-10)/10 = 0
    expect(d.sample()).toBe(0);
    setPos(40);
    fire(30); // (40-10)/10 = 3
    expect(d.sample()).toBe(3);
  });
});

describe("warp (time remapping)", () => {
  test("remaps tick timestamps", () => {
    const [tick, fire] = newEvent<number>();
    const seen: number[] = [];
    warp(tick, (t) => t * 2).listen((v) => seen.push(v));
    fire(1);
    fire(3);
    expect(seen).toEqual([2, 6]);
  });

  test("integrating over a warped clock runs faster", () => {
    const [tick, fire] = newEvent<number>();
    const x = integral(constant(1), warp(tick, (t) => t * 2), 0);
    fire(0); // warped baseline 0
    fire(5); // warped 10 -> dt=10 -> +10 (unwarped would be +5)
    expect(x.sample()).toBe(10);
  });
});
