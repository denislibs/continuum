[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / batch

# Function: batch()

> **batch**\<`A`\>(`f`): `A`

Defined in: [index.ts:1374](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1374)

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
