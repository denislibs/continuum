[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Stream`\<`A`\>, `Stream`\<`A`\>\]

Defined in: [index.ts:117](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/std/src/index.ts#L117)

Split a stream by a predicate into `[matching, rest]`.

## Type Parameters

### A

`A`

## Parameters

### e

`Stream`\<`A`\>

### pred

(`a`) => `boolean`

## Returns

\[`Stream`\<`A`\>, `Stream`\<`A`\>\]
