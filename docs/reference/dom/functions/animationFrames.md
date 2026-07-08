[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Stream`\<`number`\>

Defined in: [index.tsx:690](https://github.com/denislibs/continuum/blob/d7c5ccacccc04163a481bd76c5d444925252087e/packages/dom/src/index.tsx#L690)

An `Stream<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Stream`\<`number`\>
