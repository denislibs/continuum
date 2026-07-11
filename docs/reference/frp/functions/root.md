[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / root

# Function: root()

> **root**\<`T`\>(`fn`): `T`

Defined in: [index.ts:92](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L92)

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
