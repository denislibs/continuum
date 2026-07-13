---
"@continuum-js/router": patch
---

Link no longer intercepts external / cross-origin / non-http links (or non-_self targets); it falls through to the browser instead of preventDefault-ing and throwing in pushState. Adds a target prop.
