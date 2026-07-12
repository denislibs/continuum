[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / root

# Function: root()

> **root**\<`T`\>(`fn`): `T`

Defined in: [index.ts:92](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L92)

A root scope for state that outlives any component — module-level counters,
app-wide processes. `fn` receives the dispose handle; state declared inside
lives until it is called.

## Type Parameters

### T

`T`

## Parameters

### fn

(`dispose`) => `T`

## Returns

`T`
