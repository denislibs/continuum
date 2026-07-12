[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / newBehavior

# ~~Function: newBehavior()~~

> **newBehavior**\<`A`\>(`init`, `eq?`): \[[`State`](../classes/State.md)\<`A`\>, (`a`) => `void`\]

Defined in: [index.ts:1409](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1409)

A source behavior plus its setter.

Setting a value equal to the current one (by `eq`, default `Object.is`)
is a no-op: no moment opens, no subscriber wakes. A state is a value
across time — "changing" it to the same value is not a change. Pass a
custom `eq` for structural comparison, or `() => false` to deliver every
set.

## Type Parameters

### A

`A`

## Parameters

### init

`A`

### eq?

(`prev`, `next`) => `boolean`

## Returns

\[[`State`](../classes/State.md)\<`A`\>, (`a`) => `void`\]

## Deprecated

Use `state(init, eq?)` — the same cell as one value with
`.set` (and `.on` for declarative transitions). Removed in 1.0.
