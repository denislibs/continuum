[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / batch

# Function: batch()

> **batch**\<`A`\>(`f`): `A`

Defined in: [index.ts:1115](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1115)

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
