# Animation

::: tip In plain words
Smooth motion: a frame clock and position as accumulated velocity — or just a CSS transition when that is enough.
:::

Continuum inherits Conal Elliott's original idea: an animation is not a loop
mutating pixels but an **equation over continuous time**. Position is the
integral of velocity; velocity is the derivative of position; fast-forward
is a remapping of the clock.

## The clock

Continuous time in a discrete engine is _numerically sampled_. The clock is
an ordinary event of timestamps:

```ts
import { animationFrames } from "@continuum-js/dom";

const ticks = animationFrames(); // Event<number> of rAF timestamps (ms)
```

`animationFrames()` registers with the current owner — when the component's
subtree is disposed, the `requestAnimationFrame` loop stops by itself.

## `integral`: position from velocity

```tsx
import { constant, integral } from "@continuum-js/frp";

const velocity = constant(0.1); // px per ms
const x = integral(velocity, ticks); // Behavior<number>, px

const style = x.map((px) => ({ transform: `translateX(${px}px)` }));
return <div class="box" style={style} />;
```

`integral(b, tick, init?)` accumulates `b · dt` once per tick (forward
Euler). The _description_ is resolution-independent — "position is the
integral of velocity" — and the clock's resolution only enters at sampling
time. Velocity is a Behavior, so it can itself be derived: ease-outs,
spring forces, pause (velocity 0) are all ordinary `map`s.

## `derivative`: velocity from position

```ts
import { derivative } from "@continuum-js/frp";

const speed = derivative(mouseX, ticks); // px per ms, finite differences
```

Useful for gesture velocity (fling), or for reacting to how fast a value
changes rather than to the value itself.

## `warp`: bending time

A warped clock is just a mapped event — and everything downstream lives in
the warped time:

```ts
import { warp } from "@continuum-js/frp";

const fast = integral(
  velocity,
  warp(ticks, (t) => t * 2),
); // 2× speed
const reverse = warp(ticks, (t) => -t); // time runs backwards
```

Slow motion, fast-forward, and pause are clock transformations, not special
cases inside your animation code.

## Discrete animation

Not everything needs continuous time. A tick-driven sprite is a fold:

```ts
const frame = ticks.accum(0, (_t, f) => (f + 1) % FRAMES);
const src = frame.map((f) => `/sprites/run-${f}.png`);
```

And CSS transitions still exist: for simple state-driven motion, bind a
class (`class={open.map((o) => (o ? "panel open" : "panel"))}`) and let the
browser animate.

## A working example

The [animation example](https://github.com/denislibs/continuum/tree/main/examples/animation)
renders two boxes: one on the normal clock, one on `warp(t => 2t)` — the
same `integral`, twice the distance in the same wall-clock time.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
