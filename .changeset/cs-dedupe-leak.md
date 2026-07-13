---
"@continuum-js/std": patch
---

dedupe is now demand-activated, so it detaches from its source when unobserved instead of leaking the subscription (and its upstream chain) for the lifetime of the state.
