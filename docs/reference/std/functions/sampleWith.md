[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / sampleWith

# Function: sampleWith()

> **sampleWith**\<`A`, `B`\>(`trigger`, `b`): `Stream`\<`B`\>

Defined in: [index.ts:130](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/std/src/index.ts#L130)

Sample `b` at each occurrence of `trigger`, discarding the trigger's value.

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### trigger

`Stream`\<`A`\>

### b

`Behavior`\<`B`\>

## Returns

`Stream`\<`B`\>
