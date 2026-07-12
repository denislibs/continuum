[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`Wire`](../classes/Wire.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`Wire`](../classes/Wire.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

## Returns

[`Wire`](../classes/Wire.md)\<`number`\>
