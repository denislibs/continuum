[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / distinct

# Function: distinct()

> **distinct**\<`A`\>(`e`, `eq?`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:788](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/frp/src/index.ts#L788)

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
