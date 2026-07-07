[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Event`\<`number`\>

Defined in: [index.tsx:686](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/dom/src/index.tsx#L686)

An `Event<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Event`\<`number`\>
