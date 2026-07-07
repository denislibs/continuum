[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`Behavior`](../classes/Behavior.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`Behavior`](../classes/Behavior.md)\<`number`\>

### tick

[`Event`](../classes/Event.md)\<`number`\>

## Returns

[`Behavior`](../classes/Behavior.md)\<`number`\>
