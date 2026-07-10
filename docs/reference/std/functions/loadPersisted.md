[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / loadPersisted

# Function: loadPersisted()

> **loadPersisted**\<`T`\>(`key`, `fallback`, `storage?`): `T`

Defined in: [index.ts:226](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/std/src/index.ts#L226)

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
