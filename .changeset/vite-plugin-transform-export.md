---
"@continuum-js/vite-plugin": minor
---

Expose the raw babel transform as a `@continuum-js/vite-plugin/transform`
subpath export. This lets tooling run the exact compiler the plugin uses
outside a Vite build — the docs playground uses it to show what JSX compiles
into. The default plugin export is unchanged.
