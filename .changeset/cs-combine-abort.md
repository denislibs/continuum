---
"@continuum-js/frp": patch
---

combine/lift2 no longer goes permanently silent if the moment that first wakes it aborts before its deferred reseed; the reseed state is keyed to the transaction.
