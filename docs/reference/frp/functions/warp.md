[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / warp

# Function: warp()

> **warp**(`tick`, `remap`): [`Stream`](../classes/Stream.md)\<`number`\>

Defined in: [continuous.ts:58](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/continuous.ts#L58)

Time warping: remap the clock's timestamps. Integrating/differentiating over
a warped clock stretches or compresses time — e.g. `warp(tick, t => 2*t)`
runs everything downstream twice as fast.

## Parameters

### tick

[`Stream`](../classes/Stream.md)\<`number`\>

### remap

(`t`) => `number`

## Returns

[`Stream`](../classes/Stream.md)\<`number`\>
