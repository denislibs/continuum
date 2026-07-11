[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / runInScope

# Function: runInScope()

> **runInScope**\<`T`\>(`scope`, `fn`): `T`

Defined in: [index.ts:77](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L77)

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
