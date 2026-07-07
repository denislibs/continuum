[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / resource

# Function: resource()

> **resource**\<`A`, `T`\>(`trigger`, `fetcher`): `Behavior`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>

Defined in: [index.ts:179](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/std/src/index.ts#L179)

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

`Event`\<`A`\>

### fetcher

(`arg`) => `Promise`\<`T`\>

## Returns

`Behavior`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>
