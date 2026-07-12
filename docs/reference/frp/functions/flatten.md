[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / flatten

# Function: flatten()

## Call Signature

> **flatten**\<`A`\>(`w`): [`Wire`](../classes/Wire.md)\<`A`\>

Defined in: [index.ts:1343](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1343)

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

Defined in: [index.ts:1344](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1344)

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
