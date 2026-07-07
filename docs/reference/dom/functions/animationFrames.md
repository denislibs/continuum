[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Event`\<`number`\>

Defined in: [index.tsx:690](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/dom/src/index.tsx#L690)

An `Event<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Event`\<`number`\>
