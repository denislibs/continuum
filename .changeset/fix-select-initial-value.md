---
"@continuum-js/dom": patch
"@continuum-js/vite-plugin": patch
---

`<select value>` keeps its initial selection. The factory path re-asserts the
value after options are appended; the compiled path now emits `<option value>`
as a static template attribute (instead of a runtime prop) so the `<select>`'s
value hole, run after `cloneNode`, sees its options already valued. Both paths
now behave identically.
