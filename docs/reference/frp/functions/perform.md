[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / perform

# Function: perform()

> **perform**\<`A`, `B`\>(`e`, `run`): [`Stream`](../classes/Stream.md)\<[`Result`](../type-aliases/Result.md)\<`unknown`, `B`\>\>

Defined in: [index.ts:810](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/frp/src/index.ts#L810)

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
