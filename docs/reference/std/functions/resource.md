[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / resource

# Function: resource()

> **resource**\<`A`, `T`\>(`trigger`, `fetcher`): `State`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>

Defined in: [index.ts:181](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/std/src/index.ts#L181)

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

`State`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>
