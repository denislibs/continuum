---
"@continuum-js/frp": major
"@continuum-js/dom": major
"@continuum-js/test": minor
"@continuum-js/std": patch
---

**The observer phase runs once per animation frame.** The graph is still
synchronous — `sample()` is current the instant `set()` returns, moments
still close before `set()` returns — but observers (DOM bindings, `listen`,
`perform` requests) now run in ONE pass per frame instead of before `set()`
returns:

- **measures** (`requestMeasure`) first, before any write;
- **bindings** (`observe_`, `State.listen`) are level-triggered: one delivery
  per frame with the latest value — ten updates between frames are one DOM
  patch, one region rebuild;
- **effects** (`Stream.listen`, `perform`, `persist`) are edge-triggered:
  every occurrence, in order.

A `set` from inside the pass lands in the same pass. An observer
unsubscribed before its turn is not called. `flushFrame()` runs the pass now
— use it where code must read the DOM right after a write (focus after
opening a dialog, tests). The pass is scheduled with `requestAnimationFrame`
and a 35 ms timeout fallback for background tabs.

`frp`: `flushFrame`, `requestMeasure` exported. `dom`: `animationFrames()`
flushes after each tick so animation state reaches the DOM in the same
frame. `test`: `fire`/`click`/`type`/`flush`/`advanceTimers` run the pass,
and `flushFrame` is re-exported — tests that drive state directly (`set`,
`fire`) call `flushFrame()` before reading the DOM or a listener's log.
`std`: timing combinators (`debounce`, `throttle`, `delay`) start their
timers in the frame pass; `resource` issues its request there too.

Bundle: the scheduler costs ~300 B brotli in `frp`; budgets raised to match.
