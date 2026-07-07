[**@continuum-js/router**](../index.md)

***

[@continuum-js/router](../index.md) / lazy

# Function: lazy()

> **lazy**(`loader`, `opts?`): [`Component`](../type-aliases/Component.md)

Defined in: [index.ts:156](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/router/src/index.ts#L156)

Code-split page: `loader` MUST be a thunk with a literal dynamic import —
`lazy(() => import("./Page"))` — so the bundler emits a separate chunk.
The loader runs on first visit; the module is cached forever after.
Loading shows `fallback`, a failed chunk shows `error`.

## Parameters

### loader

() => `Promise`\<[`Component`](../type-aliases/Component.md) \| \{ `default`: [`Component`](../type-aliases/Component.md); \}\>

### opts?

#### error?

(`e`) => `Child`

#### fallback?

() => `Child`

## Returns

[`Component`](../type-aliases/Component.md)
