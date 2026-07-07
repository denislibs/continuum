[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / perform

# Function: perform()

> **perform**\<`A`, `B`\>(`e`, `run`): [`Event`](../classes/Event.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>

Defined in: [index.ts:685](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L685)

IO boundary: run an async effect per request occurrence and feed the
result back into the network as a fresh occurrence (new moment).
Errors are wrapped in a `Result` and flow as data.

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### e

[`Event`](../classes/Event.md)\<`A`\>

### run

(`a`) => `Promise`\<`B`\>

## Returns

[`Event`](../classes/Event.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>
