[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / filterMap

# Function: filterMap()

> **filterMap**\<`A`, `B`\>(`e`, `f`): `Stream`\<`B`\>

Defined in: [index.ts:91](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/std/src/index.ts#L91)

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
