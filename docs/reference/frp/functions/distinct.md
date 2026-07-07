[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Event`](../classes/Event.md)\<`A`\>

Defined in: [index.ts:574](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L574)

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
