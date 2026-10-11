---
"@continuum-js/dom": minor
---

Rows with live data: `each(items, key, (item, row) => …)` and
`<Each>{(item, row) => …}</Each>` pass a second argument — `row: State<T>`,
the item under the same key across list updates. A row built once keeps
showing edits (`row.map((m) => m.text)`) without a rebuild. The cell exists
only when the render declares the second parameter; one-argument renders are
unchanged and pay nothing.
