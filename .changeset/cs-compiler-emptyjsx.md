---
"@continuum-js/vite-plugin": patch
---

An empty JSX expression container ({} or {/* comment */}) between text runs no longer shifts sibling node paths; children are counted by real DOM position.
