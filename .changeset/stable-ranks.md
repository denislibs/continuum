---
"@continuum-js/frp": patch
---

Stable ranks under switch (roadmap §14 #6). Rank-propagation targets are
now refcounted and removed on unsubscribe (a long-lived source used to
accumulate one dead entry per mount/unmount cycle, slowing every rank bump
and pinning dead subtrees in memory). switchB/switchE rebase their rank
back down to the live topology on rewire, so a visit to a deep chain no
longer inflates ranks forever. A dependency cycle woven through switches
now fails loudly: the ordinary cycle detector sees the live topology once
dead targets are gone, and a RANK_LIMIT backstop catches exotic temporal
cycles with a descriptive error.
