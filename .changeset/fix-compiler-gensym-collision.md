---
"@continuum-js/vite-plugin": patch
---

Generate collision-free identifiers in the JSX→template transform. User code
that referenced `_r` or declared/imported the runtime names (`_$insert`, …)
previously captured or clashed with the compiler's injected identifiers; the
IIFE now returns the cloned element even when its clone variable is renamed
(previously a renamed clone still `return`ed the user's binding).
