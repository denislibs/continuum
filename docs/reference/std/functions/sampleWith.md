[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / sampleWith

# Function: sampleWith()

> **sampleWith**\<`A`, `B`\>(`trigger`, `b`): `Stream`\<`B`\>

Defined in: [index.ts:130](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/std/src/index.ts#L130)

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
