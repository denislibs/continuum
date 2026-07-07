[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / distinctB

# Function: distinctB()

> **distinctB**\<`A`\>(`b`, `eq?`): `Behavior`\<`A`\>

Defined in: [index.ts:146](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/std/src/index.ts#L146)

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
