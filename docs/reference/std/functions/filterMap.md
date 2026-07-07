[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / filterMap

# Function: filterMap()

> **filterMap**\<`A`, `B`\>(`e`, `f`): `Event`\<`B`\>

Defined in: [index.ts:90](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/std/src/index.ts#L90)

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
