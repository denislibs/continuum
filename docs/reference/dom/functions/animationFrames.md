[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Event`\<`number`\>

Defined in: [index.tsx:613](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/dom/src/index.tsx#L613)

An `Event<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Event`\<`number`\>
