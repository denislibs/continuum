[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / batch

# Function: batch()

> **batch**\<`A`\>(`f`): `A`

Defined in: [index.ts:758](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/frp/src/index.ts#L758)

Run several fires as ONE moment. Every `fire`/`set` inside the callback
joins the same transaction: downstream combinators recompute once,
coalescing applies, and observers run once after the moment closes.
Nested `batch` calls join the enclosing moment. Returns the callback's
value.

## Type Parameters

### A

`A`

## Parameters

### f

() => `A`

## Returns

`A`
