[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / selector

# Function: selector()

## Call Signature

> **selector**\<`K`\>(`w`): (`key`) => [`Wire`](../classes/Wire.md)\<`boolean`\>

Defined in: [index.ts:1248](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1248)

Keyed selection with O(2) updates. ONE process watches `w`; each key gets
a tiny cell that flips only when the selection enters or leaves it —
selecting a row in a 10k list updates two cells instead of recomputing
10k derivations. Both flips share the moment of the selection change.

`selector(selected)` yields `(key) => Wire<boolean>`; the value form
`selector(selected, on, off)` yields ready-to-bind values
(`class={cls(row.id)}`). The watching process belongs to the ambient
scope; requested cells live until the scope disposes.

### Type Parameters

#### K

`K`

### Parameters

#### w

[`Wire`](../classes/Wire.md)\<`K`\>

### Returns

(`key`) => [`Wire`](../classes/Wire.md)\<`boolean`\>

## Call Signature

> **selector**\<`K`, `V`\>(`w`, `on`, `off`): (`key`) => [`Wire`](../classes/Wire.md)\<`V`\>

Defined in: [index.ts:1249](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1249)

Keyed selection with O(2) updates. ONE process watches `w`; each key gets
a tiny cell that flips only when the selection enters or leaves it —
selecting a row in a 10k list updates two cells instead of recomputing
10k derivations. Both flips share the moment of the selection change.

`selector(selected)` yields `(key) => Wire<boolean>`; the value form
`selector(selected, on, off)` yields ready-to-bind values
(`class={cls(row.id)}`). The watching process belongs to the ambient
scope; requested cells live until the scope disposes.

### Type Parameters

#### K

`K`

#### V

`V`

### Parameters

#### w

[`Wire`](../classes/Wire.md)\<`K`\>

#### on

`V`

#### off

`V`

### Returns

(`key`) => [`Wire`](../classes/Wire.md)\<`V`\>
