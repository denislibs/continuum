[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / derivative

# Function: derivative()

> **derivative**(`b`, `tick`): [`Behavior`](../classes/Behavior.md)\<`number`\>

Defined in: [continuous.ts:36](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/continuous.ts#L36)

Differentiate a behavior with respect to a clock (finite differences).
The first tick establishes the baseline (derivative 0).

## Parameters

### b

[`Behavior`](../classes/Behavior.md)\<`number`\>

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

## Returns

[`Behavior`](../classes/Behavior.md)\<`number`\>
