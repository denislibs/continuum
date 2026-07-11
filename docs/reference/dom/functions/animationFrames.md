[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Stream`\<`number`\>

Defined in: [index.tsx:742](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/dom/src/index.tsx#L742)

An `Stream<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Stream`\<`number`\>
