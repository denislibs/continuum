[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / partition

# Function: partition()

> **partition**\<`A`\>(`e`, `pred`): \[`Event`\<`A`\>, `Event`\<`A`\>\]

Defined in: [index.ts:116](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/std/src/index.ts#L116)

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
