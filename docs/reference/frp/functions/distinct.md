[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Event`](../classes/Event.md)\<`A`\>

Defined in: [index.ts:701](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/frp/src/index.ts#L701)

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
