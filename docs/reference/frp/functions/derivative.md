[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`Behavior`](../classes/Behavior.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`Behavior`](../classes/Behavior.md)\<`number`\>

### tick

[`Event`](../classes/Event.md)\<`number`\>

## Returns

[`Behavior`](../classes/Behavior.md)\<`number`\>
