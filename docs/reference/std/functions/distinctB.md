[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / distinctB

# Function: distinctB()

> **distinctB**\<`A`\>(`b`, `eq?`): `Behavior`\<`A`\>

Defined in: [index.ts:149](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/std/src/index.ts#L149)

A behavior that suppresses updates equal to the current value (default `Object.is`).

## Type Parameters

### A

`A`

## Parameters

### b

`Behavior`\<`A`\>

### eq?

(`x`, `y`) => `boolean`

## Returns

`Behavior`\<`A`\>
