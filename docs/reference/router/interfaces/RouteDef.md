[**@continuum-js/router**](../index.md)

***

[@continuum-js/router](../index.md) / RouteDef

# Interface: RouteDef

Defined in: [match.ts:12](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/router/src/match.ts#L12)

## Properties

### children?

> `optional` **children?**: `RouteDef`[]

Defined in: [match.ts:21](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/router/src/match.ts#L21)

Nested routes, rendered into the parent's `<Outlet>`.

***

### component?

> `optional` **component?**: [`Component`](../type-aliases/Component.md)

Defined in: [match.ts:19](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/router/src/match.ts#L19)

What to render. A layout without content may omit it (children render through).

***

### guard?

> `optional` **guard?**: (`params`) => `string` \| `true`

Defined in: [match.ts:26](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/router/src/match.ts#L26)

Pure guard: return `true` to pass or a path to redirect to
(applied with `replace`, so the guarded URL doesn't pollute history).

#### Parameters

##### params

[`Params`](../type-aliases/Params.md)

#### Returns

`string` \| `true`

***

### path

> **path**: `string`

Defined in: [match.ts:17](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/router/src/match.ts#L17)

Path relative to the parent: `""` (index), `"users"`, `":id"`,
`"docs/api"`, or `"*"` (catch-all, rest available as `params["*"]`).
