[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / runInScope

# Function: runInScope()

> **runInScope**\<`T`\>(`scope`, `fn`): `T`

Defined in: [index.ts:107](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L107)

Run `fn` with `scope` as the ambient owner; restores the previous one.

## Type Parameters

### T

`T`

## Parameters

### scope

[`Scope`](../classes/Scope.md) \| `null`

### fn

() => `T`

## Returns

`T`
