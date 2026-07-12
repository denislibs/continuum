[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / integral

# Function: integral()

> **integral**(`b`, `tick`, `init?`): [`State`](../classes/State.md)\<`number`\>

Defined in: [continuous.ts:18](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/continuous.ts#L18)

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
