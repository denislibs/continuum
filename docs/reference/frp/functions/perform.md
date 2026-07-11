[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / perform

# Function: perform()

> **perform**\<`A`, `B`\>(`e`, `run`): [`Stream`](../classes/Stream.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>

Defined in: [index.ts:1328](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1328)

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

[`Stream`](../classes/Stream.md)\<`A`\>

### run

(`a`) => `Promise`\<`B`\>

## Returns

[`Stream`](../classes/Stream.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>
