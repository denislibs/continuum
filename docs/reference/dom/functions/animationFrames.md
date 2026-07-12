[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / animationFrames

# Function: animationFrames()

> **animationFrames**(): `Stream`\<`number`\>

Defined in: [index.tsx:963](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L963)

An `Stream<number>` of `requestAnimationFrame` timestamps (ms). Drives the
continuous-time combinators (`integral`/`derivative`/`warp` from the core).
Registered against the current owner: it stops automatically on unmount.

## Returns

`Stream`\<`number`\>
