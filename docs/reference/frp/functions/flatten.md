[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / flatten

# Function: flatten()

## Call Signature

> **flatten**\<`A`\>(`w`): [`Wire`](../classes/Wire.md)\<`A`\>

Defined in: [index.ts:1224](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1224)

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

Defined in: [index.ts:1225](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1225)

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
