[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / newBehavior

# Function: newBehavior()

> **newBehavior**\<`A`\>(`init`, `eq?`): \[[`Behavior`](../classes/Behavior.md)\<`A`\>, (`a`) => `void`\]

Defined in: [index.ts:727](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/frp/src/index.ts#L727)

A source behavior (a `hold` over a source event) plus its setter.

Setting a value equal to the current one (by `eq`, default `Object.is`)
is a no-op: no moment opens, no subscriber wakes. A behavior is a value
across time — "changing" it to the same value is not a change. Pass a
custom `eq` for structural comparison, or `() => false` to deliver every
set (then de-duplicate downstream with `distinctB` where needed).

## Type Parameters

### A

`A`

## Parameters

### init

`A`

### eq?

(`prev`, `next`) => `boolean`

## Returns

\[[`Behavior`](../classes/Behavior.md)\<`A`\>, (`a`) => `void`\]
