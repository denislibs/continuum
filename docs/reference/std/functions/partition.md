[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Stream`\<`A`\>, `Stream`\<`A`\>\]

Defined in: [index.ts:117](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/std/src/index.ts#L117)

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
