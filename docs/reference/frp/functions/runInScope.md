[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / runInScope

# Function: runInScope()

> **runInScope**\<`T`\>(`scope`, `fn`): `T`

Defined in: [index.ts:107](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L107)

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
