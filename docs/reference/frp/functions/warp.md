[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / warp

# Function: warp()

> **warp**(`tick`, `remap`): [`Event`](../classes/Event.md)\<`number`\>

Defined in: [continuous.ts:58](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/frp/src/continuous.ts#L58)

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
