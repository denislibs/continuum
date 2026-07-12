[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / root

# Function: root()

> **root**\<`T`\>(`fn`): `T`

Defined in: [index.ts:108](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L108)

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
