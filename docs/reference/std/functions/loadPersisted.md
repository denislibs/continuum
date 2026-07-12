[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / loadPersisted

# Function: loadPersisted()

> **loadPersisted**\<`T`\>(`key`, `fallback`, `storage?`): `T`

Defined in: [index.ts:223](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/std/src/index.ts#L223)

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
