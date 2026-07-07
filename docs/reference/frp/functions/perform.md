[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / perform

# Function: perform()

> **perform**\<`A`, `B`\>(`e`, `run`): [`Event`](../classes/Event.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>

Defined in: [index.ts:723](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/frp/src/index.ts#L723)

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
