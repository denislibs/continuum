[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / filterMap

# Function: filterMap()

> **filterMap**\<`A`, `B`\>(`e`, `f`): `Stream`\<`B`\>

Defined in: [index.ts:91](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/std/src/index.ts#L91)

Map, dropping occurrences whose result is `null`/`undefined`.

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### e

`Stream`\<`A`\>

### f

(`a`) => `B` \| `null` \| `undefined`

## Returns

`Stream`\<`B`\>
