[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:890](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L890)

De-duplicate consecutive equal values (filter with one-value memory).
Default comparison is `Object.is`.

## Type Parameters

### A

`A`

## Parameters

### e

[`Stream`](../classes/Stream.md)\<`A`\>

### eq?

(`a`, `b`) => `boolean`

## Returns

[`Stream`](../classes/Stream.md)\<`A`\>
