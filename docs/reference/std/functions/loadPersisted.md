[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / loadPersisted

# Function: loadPersisted()

> **loadPersisted**\<`T`\>(`key`, `fallback`, `storage?`): `T`

Defined in: [index.ts:223](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/std/src/index.ts#L223)

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
