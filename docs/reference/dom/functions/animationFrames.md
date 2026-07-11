[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Stream`\<`number`\>

Defined in: [index.tsx:753](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/dom/src/index.tsx#L753)

An `Stream<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Stream`\<`number`\>
