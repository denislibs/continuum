[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / wire

# Function: wire()

> **wire**\<`A`\>(`init`, `eq?`): [`WireSource`](../interfaces/WireSource.md)\<`A`\>

Defined in: [index.ts:1173](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1173)

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
