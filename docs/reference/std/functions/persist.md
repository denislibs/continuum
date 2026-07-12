[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / persist

# Function: persist()

> **persist**\<`T`\>(`key`, `b`, `storage?`): `Unlisten`

Defined in: [index.ts:243](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/std/src/index.ts#L243)

Mirror every value of `b` (including the current one) into storage as JSON.
Best-effort: a throwing `setItem` (quota, private mode) is swallowed — the
network must not break because a mirror did. Returns the unlisten; tie it
to a scope (`onCleanup(persist(key, b))`) or keep it for a manual stop.

## Type Parameters

### T

`T`

## Parameters

### key

`string`

### b

`State`\<`T`\>

### storage?

[`StorageLike`](../type-aliases/StorageLike.md) \| `undefined`

## Returns

`Unlisten`
