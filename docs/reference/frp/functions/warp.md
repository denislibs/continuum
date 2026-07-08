[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / warp

# Function: warp()

> **warp**(`tick`, `remap`): [`Stream`](../classes/Stream.md)\<`number`\>

Defined in: [continuous.ts:58](https://github.com/denislibs/continuum/blob/d7c5ccacccc04163a481bd76c5d444925252087e/packages/frp/src/continuous.ts#L58)

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
