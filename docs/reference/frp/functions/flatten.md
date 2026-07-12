[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / flatten

# Function: flatten()

## Call Signature

> **flatten**\<`A`\>(`w`): [`State`](../classes/State.md)\<`A`\>

Defined in: [index.ts:1625](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1625)

Follow the state (or stream) currently selected by an outer state —
`State<State<A>> → State<A>` and `State<Stream<A>> → Stream<A>` under one
name. The switch commits at the moment boundary (see FRP-MODEL §6).

### Type Parameters

#### A

`A`

### Parameters

#### w

[`State`](../classes/State.md)\<[`State`](../classes/State.md)\<`A`\>\>

### Returns

[`State`](../classes/State.md)\<`A`\>

## Call Signature

> **flatten**\<`A`\>(`w`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:1626](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1626)

Follow the state (or stream) currently selected by an outer state —
`State<State<A>> → State<A>` and `State<Stream<A>> → Stream<A>` under one
name. The switch commits at the moment boundary (see FRP-MODEL §6).

### Type Parameters

#### A

`A`

### Parameters

#### w

[`State`](../classes/State.md)\<[`Stream`](../classes/Stream.md)\<`A`\>\>

### Returns

[`Stream`](../classes/Stream.md)\<`A`\>
