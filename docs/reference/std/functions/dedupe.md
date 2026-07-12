[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / dedupe

# Function: dedupe()

> **dedupe**\<`A`\>(`b`, `eq?`): `State`\<`A`\>

Defined in: [index.ts:147](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/std/src/index.ts#L147)

A state that suppresses updates equal to the current value (default `Object.is`).
(Named `distinctB` before 1.0 — the Behavior-era name.)

## Type Parameters

### A

`A`

## Parameters

### b

`State`\<`A`\>

### eq?

(`x`, `y`) => `boolean`

## Returns

`State`\<`A`\>
