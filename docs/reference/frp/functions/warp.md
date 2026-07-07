[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / warp

# Function: warp()

> **warp**(`tick`, `remap`): [`Event`](../classes/Event.md)\<`number`\>

Defined in: [continuous.ts:58](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/continuous.ts#L58)

Time warping: remap the clock's timestamps. Integrating/differentiating over
a warped clock stretches or compresses time — e.g. `warp(tick, t => 2*t)`
runs everything downstream twice as fast.

## Parameters

### tick

[`Event`](../classes/Event.md)\<`number`\>

### remap

(`t`) => `number`

## Returns

[`Event`](../classes/Event.md)\<`number`\>
