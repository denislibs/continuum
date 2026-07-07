---
"@continuum-js/dom": minor
---

Helper types for writing shared components, exported from the package root:
`ComponentProps<"button">` / `ComponentProps<typeof Card>` (a tag's or a
component's props, for wrapping and forwarding), `Reactive<T>` (a plain value
or a `Behavior` of it — the type of every JSX attribute), `Ref<E>` and
`EventHandler<Ev, E>`. Event handlers on intrinsic tags now type their
`currentTarget` to the tag's element — `onSubmit` on a `<form>` gives
`e.currentTarget: HTMLFormElement` with no cast, the native-event answer to
React's `MouseEvent<HTMLButtonElement>`. Types only — no runtime change.
