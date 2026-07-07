[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / filterMap

# Function: filterMap()

> **filterMap**\<`A`, `B`\>(`e`, `f`): `Event`\<`B`\>

Defined in: [index.ts:91](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/std/src/index.ts#L91)

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
