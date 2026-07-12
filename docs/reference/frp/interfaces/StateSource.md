[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / StateSource

# Interface: StateSource\<A\>

Defined in: [index.ts:1404](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1404)

A source state: a cell you read like any state and write via `.set`.

## Extends

- [`State`](../classes/State.md)\<`A`\>

## Type Parameters

### A

`A`

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:966](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L966)

Pull the current value without opening a transaction.

#### Returns

`A`

#### Inherited from

[`State`](../classes/State.md).[`sampleNoTrans`](../classes/State.md#samplenotrans)

***

### updates

> **updates**: [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:968](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L968)

Push notifications of discrete changes (empty for continuous behaviors).

#### Inherited from

[`State`](../classes/State.md).[`updates`](../classes/State.md#updates)

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:988](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L988)

Sample this state at each occurrence of `e`: `draft.at(submits)` is the
stream of the state's values as of those moments (pre-moment, with exact
simultaneity semantics). An optional combiner receives `(value, event)`.

##### Type Parameters

###### B

`B`

##### Parameters

###### e

[`Stream`](../classes/Stream.md)\<`B`\>

##### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

##### Inherited from

[`State`](../classes/State.md).[`at`](../classes/State.md#at)

#### Call Signature

> **at**\<`B`, `C`\>(`e`, `f`): [`Stream`](../classes/Stream.md)\<`C`\>

Defined in: [index.ts:989](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L989)

Sample this state at each occurrence of `e`: `draft.at(submits)` is the
stream of the state's values as of those moments (pre-moment, with exact
simultaneity semantics). An optional combiner receives `(value, event)`.

##### Type Parameters

###### B

`B`

###### C

`C`

##### Parameters

###### e

[`Stream`](../classes/Stream.md)\<`B`\>

###### f

(`value`, `event`) => `C`

##### Returns

[`Stream`](../classes/Stream.md)\<`C`\>

##### Inherited from

[`State`](../classes/State.md).[`at`](../classes/State.md#at)

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:1016](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1016)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

#### Inherited from

[`State`](../classes/State.md).[`dispose`](../classes/State.md#dispose)

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:999](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L999)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

#### Inherited from

[`State`](../classes/State.md).[`listen`](../classes/State.md#listen)

***

### map()

> **map**\<`B`\>(`f`): [`State`](../classes/State.md)\<`B`\>

Defined in: [index.ts:979](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L979)

Pointwise transform (continuous-safe: recomputed on each sample).

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

[`State`](../classes/State.md)\<`B`\>

#### Inherited from

[`State`](../classes/State.md).[`map`](../classes/State.md#map)

***

### on()

> **on**\<`E`\>(`e`, `f`): `this`

Defined in: [index.ts:1422](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1422)

Declare a state transition: on each occurrence of `e`, fold the reducer
over the current value — `(state, event) => next`, `useReducer` order.
The occurrence and the state's update share ONE moment (snapshot
semantics hold), and several `.on` sources firing simultaneously fold
sequentially. The transition process belongs to the ambient scope.

#### Type Parameters

##### E

`E`

#### Parameters

##### e

[`Stream`](../classes/Stream.md)\<`E`\>

##### f

(`state`, `event`) => `A`

#### Returns

`this`

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:1021](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1021)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

#### Inherited from

[`State`](../classes/State.md).[`retain`](../classes/State.md#retain)

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:971](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L971)

#### Returns

`A`

#### Inherited from

[`State`](../classes/State.md).[`sample`](../classes/State.md#sample)

***

### set()

> **set**(`a`): `void`

Defined in: [index.ts:1406](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1406)

Set the current value; equal values (by the cell's `eq`) are a no-op.

#### Parameters

##### a

`A`

#### Returns

`void`

***

### update()

> **update**(`f`): `void`

Defined in: [index.ts:1414](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1414)

Read-modify-write: fold the updater over the current value —
`count.update((n) => n + 1)`. Inside a `batch` the updater sees the
value staged by this very moment, so several updates compose (unlike
`set(sample() + 1)`, which reads the pre-moment value). Equal results
(by the cell's `eq`) are a no-op.

#### Parameters

##### f

(`state`) => `A`

#### Returns

`void`
