[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / newBehavior

# ~~Function: newBehavior()~~

> **newBehavior**\<`A`\>(`init`, `eq?`): \[[`Wire`](../classes/Wire.md)\<`A`\>, (`a`) => `void`\]

Defined in: [index.ts:1115](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1115)

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
