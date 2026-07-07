[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / warp

# Function: warp()

> **warp**(`tick`, `remap`): [`Event`](../classes/Event.md)\<`number`\>

Defined in: [continuous.ts:58](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/frp/src/continuous.ts#L58)

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
