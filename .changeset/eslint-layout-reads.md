---
"@continuum-js/eslint-plugin": minor
---

New rule `no-layout-reads-in-effects` (in `recommended`, error): a layout
read — `offsetHeight`, `scrollTop`, `getBoundingClientRect()`,
`getComputedStyle()`, `focus()`, … — inside an effect callback (`listen`,
`onMount`, `perform`, `.on`) forces a reflow between the renderer's writes.
Read through `measure(trigger, fn)` or the layout sources
(`createSize`/`createScroll`), or wrap an intentional read in
`forceMeasure(() => …)`. Plain assignments (`el.scrollTop = 0`) are writes
and pass; compound ones (`+=`) read and are flagged.
