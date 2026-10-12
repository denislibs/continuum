---
"@continuum-js/std": minor
---

`holdWhile(state, gate)`: freeze a state while `gate` is true and catch up
to its latest value in one step on release (nothing is emitted if it did not
change). A formula — attached to its inputs only while listened. Hold a heavy
region still during an animation: `each(holdWhile(items, isAnimating), …)`.
