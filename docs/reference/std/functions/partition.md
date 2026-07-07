[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Event`\<`A`\>, `Event`\<`A`\>\]

Defined in: [index.ts:117](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/std/src/index.ts#L117)

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
