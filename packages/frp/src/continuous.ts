// Continuum — continuous-time combinators (roadmap §14 #7).
//
// Continuous time in the discrete branch is *numerically sampled*: integral
// and derivative are driven by a discrete clock (`tick: Stream<number>` of
// timestamps) and accumulate deterministically, once per tick — independent of
// how many observers sample the result. This is the honest realization of
// Conal's `integral`/`derivative`/time-warping for a Sodium-style engine:
// the description is resolution-independent, the sampled result approximates it
// (forward Euler / finite differences), and the clock resolution appears only
// at tick time.

import type { Wire, Stream } from "./index.js";

/**
 * Integrate a behavior with respect to a clock (forward Euler).
 * `tick` carries the current time; the first tick establishes the baseline.
 */
export function integral(
  b: Wire<number>,
  tick: Stream<number>,
  init = 0,
): Wire<number> {
  return tick
    .accum<{ t: number | null; acc: number }>({ t: null, acc: init }, (t, s) =>
      s.t === null
        ? { t, acc: s.acc }
        : { t, acc: s.acc + b.sampleNoTrans() * (t - s.t) },
    )
    .map((s) => s.acc);
}

/**
 * Differentiate a behavior with respect to a clock (finite differences).
 * The first tick establishes the baseline (derivative 0).
 */
export function derivative(
  b: Wire<number>,
  tick: Stream<number>,
): Wire<number> {
  return tick
    .accum<{ t: number | null; v: number; d: number }>(
      { t: null, v: b.sampleNoTrans(), d: 0 },
      (t, s) => {
        const v = b.sampleNoTrans();
        if (s.t === null) return { t, v, d: 0 };
        const dt = t - s.t;
        return { t, v, d: dt === 0 ? s.d : (v - s.v) / dt };
      },
    )
    .map((s) => s.d);
}

/**
 * Time warping: remap the clock's timestamps. Integrating/differentiating over
 * a warped clock stretches or compresses time — e.g. `warp(tick, t => 2*t)`
 * runs everything downstream twice as fast.
 */
export function warp(
  tick: Stream<number>,
  remap: (t: number) => number,
): Stream<number> {
  return tick.map(remap);
}
