[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / filterMap

# Function: filterMap()

> **filterMap**\<`A`, `B`\>(`e`, `f`): `Event`\<`B`\>

Defined in: [index.ts:90](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/std/src/index.ts#L90)

Map, dropping occurrences whose result is `null`/`undefined`.

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### e

`Event`\<`A`\>

### f

(`a`) => `B` \| `null` \| `undefined`

## Returns

`Event`\<`B`\>
