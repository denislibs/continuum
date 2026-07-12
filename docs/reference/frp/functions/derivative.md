[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`State`](../classes/State.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`State`](../classes/State.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

## Returns

[`State`](../classes/State.md)\<`number`\>
