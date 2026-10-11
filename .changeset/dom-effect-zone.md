---
"@continuum-js/dom": minor
---

Law 3 in the renderer: `onMount` callbacks run in the effect zone — on the
first mount as much as on a region rebuild — so a layout read there is
flagged by devtools' strict mode (measure with the layout sources, or opt out
with `withLayout` for a third-party widget). The renderer's own layout call
(focus restore after a keyed move in `each`) runs outside the zone.
Delegated events no longer leave `currentTarget` pinned on the event object
after dispatch.
