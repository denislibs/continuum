---
"@continuum-js/dom": minor
---

Typed JSX surface. `IntrinsicElements` is no longer `any`: attributes are
derived per element from the DOM interfaces (`value`, `checked`, `href`, …),
every attribute accepts a `Behavior<T>` in place of a plain `T`, event props
are typed from `GlobalEventHandlersEventMap` in both native (`onKeydown`) and
React-style (`onKeyDown`) casing, `ref` carries the tag's concrete element
type, and `data-*`/`aria-*` are recognized. SVG elements keep a permissive
attribute surface (events/ref/class stay typed); custom elements (a dash in
the tag) accept arbitrary props. No runtime changes.
