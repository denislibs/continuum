---
"@continuum-js/router": patch
---

Route params are URL-decoded (e.g. /users/John%20Doe -> "John Doe"), falling back to the raw segment on malformed input.
