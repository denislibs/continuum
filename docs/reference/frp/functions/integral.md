[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / integral

# Function: integral()

> **integral**(`b`, `tick`, `init?`): [`Behavior`](../classes/Behavior.md)\<`number`\>

Defined in: [continuous.ts:18](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/frp/src/continuous.ts#L18)

Integrate a behavior with respect to a clock (forward Euler).
`tick` carries the current time; the first tick establishes the baseline.

## Parameters

### b

[`Behavior`](../classes/Behavior.md)\<`number`\>

### tick

[`Event`](../classes/Event.md)\<`number`\>

### init?

`number` = `0`

## Returns

[`Behavior`](../classes/Behavior.md)\<`number`\>
