[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / runInScope

# Function: runInScope()

> **runInScope**\<`T`\>(`scope`, `fn`): `T`

Defined in: [index.ts:77](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L77)

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
