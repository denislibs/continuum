[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / onMount

# Function: onMount()

> **onMount**(`fn`): `void`

Defined in: [index.tsx:125](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/dom/src/index.tsx#L125)

Register a callback to run once the current scope's nodes are inserted into
the DOM — after `mount`, or right after a dynamic region (`dyn`/`each`)
inserts a freshly built subtree. Use it for focus, measurement, and
third-party libraries that need a live element. No-op outside any owner.

## Parameters

### fn

() => `void`

## Returns

`void`
