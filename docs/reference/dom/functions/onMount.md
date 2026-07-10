[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / onMount

# Function: onMount()

> **onMount**(`fn`): `void`

Defined in: [index.tsx:130](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/dom/src/index.tsx#L130)

Register a callback to run once the current scope's nodes are inserted into
the DOM — after `mount`, or right after a dynamic region (`dyn`/`each`)
inserts a freshly built subtree. Use it for focus, measurement, and
third-party libraries that need a live element. No-op outside any owner.

## Parameters

### fn

() => `void`

## Returns

`void`
