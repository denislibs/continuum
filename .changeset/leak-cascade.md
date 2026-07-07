---
"@continuum-js/frp": minor
---

Leak fix + `retain()`. The stress suite caught a real core leak: every
`{b.map(f)}`-style binding on a behavior that outlives its component left
the derived chain subscribed to the source forever (10k mount/unmount
cycles = 10k dead listeners). The public `listen` unsubscribe now completes
the in-graph cascade the engine already had: a derived node whose last
listener leaves detaches from its inputs.

Semantics consequence: a derivation shared across mounts (created once at
module level) auto-disposes after its first consumer unmounts — re-using it
now throws a descriptive error instead of going silently dead. For
intentionally long-lived shared derivations there is the new
`retain()` (on both `Event` and `Behavior`): it exempts the node from the
cascade. `newBehavior` retains its internal hold automatically — source
behaviors are unaffected by any of this.
