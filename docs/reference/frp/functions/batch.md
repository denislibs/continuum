[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / batch

# Function: batch()

> **batch**\<`A`\>(`f`): `A`

Defined in: [index.ts:860](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L860)

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
