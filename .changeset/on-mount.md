---
"@continuum-js/dom": minor
---

New `onMount(fn)` lifecycle hook: runs the callback once the current scope's
nodes are inserted into the DOM — after `mount`, or right after `dyn`/`each`
insert a freshly built subtree. Use it for focus, measurement, and third-party
libraries that need a live element. Child scopes mount before their parents;
callbacks registered in a scope that is disposed before insertion never run.
