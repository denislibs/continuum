[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Event`\<`A`\>, `Event`\<`A`\>\]

Defined in: [index.ts:116](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/std/src/index.ts#L116)

Split a stream by a predicate into `[matching, rest]`.

## Type Parameters

### A

`A`

## Parameters

### e

`Event`\<`A`\>

### pred

(`a`) => `boolean`

## Returns

\[`Event`\<`A`\>, `Event`\<`A`\>\]
