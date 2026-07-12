[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / root

# Function: root()

> **root**\<`T`\>(`fn`): `T`

Defined in: [index.ts:122](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L122)

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
