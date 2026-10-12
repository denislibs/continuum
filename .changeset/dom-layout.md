---
"@continuum-js/dom": minor
"@continuum-js/frp": patch
---

`@continuum-js/dom/layout` — layout as an effect (law 3):

- `createSize(el)`, `createVisibility(el, opts?)`, `createScroll(el | window)`
  turn layout into State through the browser's own observers (ResizeObserver,
  IntersectionObserver, the scroll event): values arrive after layout, before
  paint, and never force a reflow.
- `measure(trigger, read)` is a layout read as an effect: `read` runs in the
  frame pass — after this moment's writes, before paint, together with every
  other measure of the frame — and its result enters the network as an
  occurrence. One read per frame per measure (the latest trigger wins); the
  results of all measures of a frame share one moment.
- `forceMeasure(fn)` (alias of the core `withLayout`) marks an explicit layout
  read from an effect.
- `beginHeavyAnimation(durationMs?)` / `isHeavyAnimating` mark a page
  transition so heavy regions can hold still with `holdWhile`.

`frp`: the frame pass runs in rounds of reads-then-writes until nothing is
pending, so a measure requested from inside the pass still runs in this frame.
