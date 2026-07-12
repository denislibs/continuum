[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / runInScope

# Function: runInScope()

> **runInScope**\<`T`\>(`scope`, `fn`): `T`

Defined in: [index.ts:93](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L93)

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
