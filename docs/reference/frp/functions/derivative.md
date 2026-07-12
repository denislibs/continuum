[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`Wire`](../classes/Wire.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`Wire`](../classes/Wire.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

## Returns

[`Wire`](../classes/Wire.md)\<`number`\>
