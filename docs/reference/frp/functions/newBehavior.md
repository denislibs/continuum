[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / newBehavior

# ~~Function: newBehavior()~~

> **newBehavior**\<`A`\>(`init`, `eq?`): \[[`Wire`](../classes/Wire.md)\<`A`\>, (`a`) => `void`\]

Defined in: [index.ts:1156](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1156)

A source behavior plus its setter.

Setting a value equal to the current one (by `eq`, default `Object.is`)
is a no-op: no moment opens, no subscriber wakes. A wire is a value
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

\[[`Wire`](../classes/Wire.md)\<`A`\>, (`a`) => `void`\]

## Deprecated

Use `wire(init, eq?)` — the same cell as one value with
`.set` (and `.on` for declarative transitions). Removed in 1.0.
