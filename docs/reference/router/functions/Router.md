[**@continuum-js/router**](../index.md)

***

[@continuum-js/router](../index.md) / Router

# Function: Router()

> **Router**(`props`): `Node`

Defined in: [index.ts:76](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/router/src/index.ts#L76)

Route the current URL through `routes`. `fallback` renders when nothing
matches (404). A guard returning a path triggers a replace-navigation.

## Parameters

### props

#### fallback?

() => `Child`

#### routes

[`RouteDef`](../interfaces/RouteDef.md)[]

## Returns

`Node`
