[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / loadPersisted

# Function: loadPersisted()

> **loadPersisted**\<`T`\>(`key`, `fallback`, `storage?`): `T`

Defined in: [index.ts:223](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/std/src/index.ts#L223)

Read a persisted value back, or `fallback` when the key is missing, the
JSON is corrupted, or storage is unavailable (SSR) — loading state must
never be the reason an app fails to start.

## Type Parameters

### T

`T`

## Parameters

### key

`string`

### fallback

`T`

### storage?

[`StorageLike`](../type-aliases/StorageLike.md) \| `undefined`

## Returns

`T`
