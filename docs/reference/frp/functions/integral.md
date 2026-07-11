[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / integral

# Function: integral()

> **integral**(`b`, `tick`, `init?`): [`Wire`](../classes/Wire.md)\<`number`\>

Defined in: [continuous.ts:18](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/continuous.ts#L18)

Integrate a behavior with respect to a clock (forward Euler).
`tick` carries the current time; the first tick establishes the baseline.

## Parameters

### b

[`Wire`](../classes/Wire.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

### init?

`number` = `0`

## Returns

[`Wire`](../classes/Wire.md)\<`number`\>
