[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / selector

# Function: selector()

## Call Signature

> **selector**\<`K`\>(`w`): (`key`) => [`State`](../classes/State.md)\<`boolean`\>

Defined in: [index.ts:1478](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1478)

Keyed selection with O(2) updates. ONE process watches `w`; each key gets
a tiny cell that flips only when the selection enters or leaves it —
selecting a row in a 10k list updates two cells instead of recomputing
10k derivations. Both flips share the moment of the selection change.

`selector(selected)` yields `(key) => State<boolean>`; the value form
`selector(selected, on, off)` yields ready-to-bind values
(`class={cls(row.id)}`). The watching process belongs to the ambient
scope. A key's cell lives while anything listens to it and is evicted
once the last listener detaches (10k cleared rows must not be retained);
re-requesting the key hands out a fresh cell seeded from the current
selection.

### Type Parameters

#### K

`K`

### Parameters

#### w

[`State`](../classes/State.md)\<`K`\>

### Returns

(`key`) => [`State`](../classes/State.md)\<`boolean`\>

## Call Signature

> **selector**\<`K`, `V`\>(`w`, `on`, `off`): (`key`) => [`State`](../classes/State.md)\<`V`\>

Defined in: [index.ts:1479](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1479)

Keyed selection with O(2) updates. ONE process watches `w`; each key gets
a tiny cell that flips only when the selection enters or leaves it —
selecting a row in a 10k list updates two cells instead of recomputing
10k derivations. Both flips share the moment of the selection change.

`selector(selected)` yields `(key) => State<boolean>`; the value form
`selector(selected, on, off)` yields ready-to-bind values
(`class={cls(row.id)}`). The watching process belongs to the ambient
scope. A key's cell lives while anything listens to it and is evicted
once the last listener detaches (10k cleared rows must not be retained);
re-requesting the key hands out a fresh cell seeded from the current
selection.

### Type Parameters

#### K

`K`

#### V

`V`

### Parameters

#### w

[`State`](../classes/State.md)\<`K`\>

#### on

`V`

#### off

`V`

### Returns

(`key`) => [`State`](../classes/State.md)\<`V`\>
