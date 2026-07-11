[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / flatten

# Function: flatten()

## Call Signature

> **flatten**\<`A`\>(`w`): [`Wire`](../classes/Wire.md)\<`A`\>

Defined in: [index.ts:1251](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1251)

Follow the wire (or stream) currently selected by an outer wire —
`Wire<Wire<A>> → Wire<A>` and `Wire<Stream<A>> → Stream<A>` under one
name. The switch commits at the moment boundary (see FRP-MODEL §6).

### Type Parameters

#### A

`A`

### Parameters

#### w

[`Wire`](../classes/Wire.md)\<[`Wire`](../classes/Wire.md)\<`A`\>\>

### Returns

[`Wire`](../classes/Wire.md)\<`A`\>

## Call Signature

> **flatten**\<`A`\>(`w`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:1252](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1252)

Follow the wire (or stream) currently selected by an outer wire —
`Wire<Wire<A>> → Wire<A>` and `Wire<Stream<A>> → Stream<A>` under one
name. The switch commits at the moment boundary (see FRP-MODEL §6).

### Type Parameters

#### A

`A`

### Parameters

#### w

[`Wire`](../classes/Wire.md)\<[`Stream`](../classes/Stream.md)\<`A`\>\>

### Returns

[`Stream`](../classes/Stream.md)\<`A`\>
