[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Event`](../classes/Event.md)\<`A`\>

Defined in: [index.ts:620](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/frp/src/index.ts#L620)

De-duplicate consecutive equal values (filter with one-value memory).
Default comparison is `Object.is`.

## Type Parameters

### A

`A`

## Parameters

### e

[`Event`](../classes/Event.md)\<`A`\>

### eq?

(`a`, `b`) => `boolean`

## Returns

[`Event`](../classes/Event.md)\<`A`\>
