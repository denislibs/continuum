[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / resource

# Function: resource()

> **resource**\<`A`, `T`\>(`trigger`, `fetcher`): `Behavior`\<[`Async`](../type-aliases/Async.md)\<`T`\>\>

Defined in: [index.ts:180](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/std/src/index.ts#L180)

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
