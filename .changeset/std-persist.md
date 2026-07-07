---
"@continuum-js/std": minor
---

`persist(key, behavior, storage?)` and `loadPersisted(key, fallback,
storage?)` — localStorage persistence as a boundary sink. Safe by contract:
corrupted JSON or missing storage (SSR) falls back instead of throwing, a
throwing `setItem` (quota, private mode) is swallowed so the network never
breaks because a mirror did. `persist` returns the unlisten — tie it to a
scope with `onCleanup(persist(key, b))`. The `storage` parameter accepts any
`StorageLike`, which also makes both functions trivially testable.
