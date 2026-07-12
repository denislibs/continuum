[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / resource

# Function: resource()

> **resource**\<`A`, `T`\>(`trigger`, `fetcher`): `Wire`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>

Defined in: [index.ts:180](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/std/src/index.ts#L180)

Turn a stream of requests into a behavior tracking the async lifecycle
(`idle → loading → ok | error`). Requests are stamped with a sequence number,
so a slow response to a superseded request is ignored (last-request-wins) —
the classic out-of-order-response bug, solved declaratively.

## Type Parameters

### A

`A`

### T

`T`

## Parameters

### trigger

`Stream`\<`A`\>

### fetcher

(`arg`) => `Promise`\<`T`\>

## Returns

`Wire`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>
