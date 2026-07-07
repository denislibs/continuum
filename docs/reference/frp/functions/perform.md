[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / perform

# Function: perform()

> **perform**\<`A`, `B`\>(`e`, `run`): [`Event`](../classes/Event.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>

Defined in: [index.ts:587](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/frp/src/index.ts#L587)

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
