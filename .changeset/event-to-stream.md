---
"@continuum-js/frp": minor
---

The Sodium rename, for the Sodium reason: `Event` is now **`Stream`**
(`newEvent` → **`newStream`**). To most people an "event" is one occurrence,
while this type is the whole stream of them — and the old name collided with
the DOM's global `Event`, forcing `globalThis.Event` dances in typed code.
`Event` and `newEvent` remain as deprecated aliases (same objects, IDE shows
the strikethrough and the replacement) and will be removed in 1.0. Nothing
else is renamed: `map`/`hold`/`snapshot`/`accum` stay canonical Sodium
vocabulary, `accumE`/`switchE` keep their names.
