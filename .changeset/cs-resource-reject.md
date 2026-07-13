---
"@continuum-js/std": patch
---

resource applies last-request-wins to failures too: a late rejection of a superseded request no longer clobbers a newer success.
