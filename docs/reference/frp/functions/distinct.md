[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:760](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L760)

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
