[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / persist

# Function: persist()

> **persist**\<`T`\>(`key`, `b`, `storage?`): `Unlisten`

Defined in: [index.ts:245](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/std/src/index.ts#L245)

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

`Behavior`\<`T`\>

### storage?

[`StorageLike`](../type-aliases/StorageLike.md) \| `undefined`

## Returns

`Unlisten`
