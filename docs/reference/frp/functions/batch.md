[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / batch

# Function: batch()

> **batch**\<`A`\>(`f`): `A`

Defined in: [index.ts:1171](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1171)

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
