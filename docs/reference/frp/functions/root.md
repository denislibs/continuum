[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / root

# Function: root()

> **root**\<`T`\>(`fn`): `T`

Defined in: [index.ts:122](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L122)

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
