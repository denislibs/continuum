[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:1287](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1287)

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
