[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / onMount

# Function: onMount()

> **onMount**(`fn`): `void`

Defined in: [index.tsx:111](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/dom/src/index.tsx#L111)

Register a callback to run once the current scope's nodes are inserted into
the DOM — after `mount`, or right after a dynamic region (`dyn`/`each`)
inserts a freshly built subtree. Use it for focus, measurement, and
third-party libraries that need a live element. No-op outside any owner.

## Parameters

### fn

() => `void`

## Returns

`void`
