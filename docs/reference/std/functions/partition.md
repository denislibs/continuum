[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Event`\<`A`\>, `Event`\<`A`\>\]

Defined in: [index.ts:117](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/std/src/index.ts#L117)

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
