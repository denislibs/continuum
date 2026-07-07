[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Event`](../classes/Event.md)\<`A`\>

Defined in: [index.ts:663](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L663)

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
