[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / integral

# Function: integral()

> **integral**(`b`, `tick`, `init?`): [`State`](../classes/State.md)\<`number`\>

Defined in: [continuous.ts:18](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/continuous.ts#L18)

Integrate a behavior with respect to a clock (forward Euler).
`tick` carries the current time; the first tick establishes the baseline.

## Parameters

### b

[`State`](../classes/State.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

### init?

`number` = `0`

## Returns

[`State`](../classes/State.md)\<`number`\>
