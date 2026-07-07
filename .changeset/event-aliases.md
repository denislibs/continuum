---
"@continuum-js/dom": minor
---

React-style event type aliases, one type argument at the parameter:
`(e: SubmitEvent<HTMLFormElement>) => …` (and `SubmitEvent` alone defaults to
`HTMLFormElement`). The full set — `MouseEvent`, `KeyboardEvent`,
`PointerEvent`, `TouchEvent`, `WheelEvent`, `DragEvent`, `FocusEvent`,
`InputEvent`, `CompositionEvent`, `ClipboardEvent`, `AnimationEvent`,
`TransitionEvent`, `UIEvent`, `SubmitEvent` — plus the generic
`Targeted<Ev, E>` escape hatch. Each alias is the native DOM event narrowed
to a concrete `currentTarget`; they shadow the globals when imported, exactly
like React's — or use the namespace form to avoid shadowing:
`import type { Events }` → `Events.MouseEvent<HTMLButtonElement>`. Types
only — no runtime change.
