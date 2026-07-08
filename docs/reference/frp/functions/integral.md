[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / integral

# Function: integral()

> **integral**(`b`, `tick`, `init?`): [`Behavior`](../classes/Behavior.md)\<`number`\>

Defined in: [continuous.ts:18](https://github.com/denislibs/continuum/blob/d7c5ccacccc04163a481bd76c5d444925252087e/packages/frp/src/continuous.ts#L18)

Integrate a behavior with respect to a clock (forward Euler).
`tick` carries the current time; the first tick establishes the baseline.

## Parameters

### b

[`Behavior`](../classes/Behavior.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

### init?

`number` = `0`

## Returns

[`Behavior`](../classes/Behavior.md)\<`number`\>
