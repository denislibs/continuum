[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / wire

# Function: wire()

> **wire**\<`A`\>(`init`, `eq?`): [`WireSource`](../interfaces/WireSource.md)\<`A`\>

Defined in: [index.ts:1214](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1214)

A source cell: the everyday way to create state. Reads like any wire
(`sample`, `map`, JSX binding), writes via `.set` — setting an equal value
(by `eq`, default `Object.is`) is a no-op.

## Type Parameters

### A

`A`

## Parameters

### init

`A`

### eq?

(`prev`, `next`) => `boolean`

## Returns

[`WireSource`](../interfaces/WireSource.md)\<`A`\>
