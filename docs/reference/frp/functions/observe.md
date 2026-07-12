[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / observe\_

# Function: observe\_()

> **observe\_**\<`A`\>(`e`, `h`): [`ObserverHandle`](../type-aliases/ObserverHandle.md)

Defined in: [index.ts:1388](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1388)

**`Internal`**

Closure-free observer subscription for the dom renderer: like
`listen`, but returns the edge record instead of an unlisten closure. The
renderer stores flat (stream, handle) pairs on its owners — two array
slots where `listen` costs two closures per binding.

## Type Parameters

### A

`A`

## Parameters

### e

[`Stream`](../classes/Stream.md)\<`A`\>

### h

`Observer`\<`A`\>

## Returns

[`ObserverHandle`](../type-aliases/ObserverHandle.md)
