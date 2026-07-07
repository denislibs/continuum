[**@continuum-js/router**](../index.md)

***

[@continuum-js/router](../index.md) / Router

# Function: Router()

> **Router**(`props`): `Node`

Defined in: [index.ts:76](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/router/src/index.ts#L76)

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
