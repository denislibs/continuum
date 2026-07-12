[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / sampleWith

# Function: sampleWith()

> **sampleWith**\<`A`, `B`\>(`trigger`, `b`): `Stream`\<`B`\>

Defined in: [index.ts:130](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/std/src/index.ts#L130)

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

`State`\<`B`\>

## Returns

`Stream`\<`B`\>
