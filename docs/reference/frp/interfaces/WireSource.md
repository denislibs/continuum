[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / WireSource

# Interface: WireSource\<A\>

Defined in: [index.ts:1141](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1141)

A source wire: a cell you read like any wire and write via `.set`.

## Extends

- [`Wire`](../classes/Wire.md)\<`A`\>

## Type Parameters

### A

`A`

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:721](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L721)

Pull the current value without opening a transaction.

#### Returns

`A`

#### Inherited from

[`Wire`](../classes/Wire.md).[`sampleNoTrans`](../classes/Wire.md#samplenotrans)

***

### updates

> **updates**: [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:723](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L723)

Push notifications of discrete changes (empty for continuous behaviors).

#### Inherited from

[`Wire`](../classes/Wire.md).[`updates`](../classes/Wire.md#updates)

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:743](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L743)

Sample this wire at each occurrence of `e`: `draft.at(submits)` is the
stream of the wire's values as of those moments (pre-moment, with exact
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

[`Wire`](../classes/Wire.md).[`at`](../classes/Wire.md#at)

#### Call Signature

> **at**\<`B`, `C`\>(`e`, `f`): [`Stream`](../classes/Stream.md)\<`C`\>

Defined in: [index.ts:744](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L744)

Sample this wire at each occurrence of `e`: `draft.at(submits)` is the
stream of the wire's values as of those moments (pre-moment, with exact
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

[`Wire`](../classes/Wire.md).[`at`](../classes/Wire.md#at)

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:771](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L771)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

#### Inherited from

[`Wire`](../classes/Wire.md).[`dispose`](../classes/Wire.md#dispose)

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:754](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L754)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

#### Inherited from

[`Wire`](../classes/Wire.md).[`listen`](../classes/Wire.md#listen)

***

### map()

> **map**\<`B`\>(`f`): [`Wire`](../classes/Wire.md)\<`B`\>

Defined in: [index.ts:734](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L734)

Pointwise transform (continuous-safe: recomputed on each sample).

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

[`Wire`](../classes/Wire.md)\<`B`\>

#### Inherited from

[`Wire`](../classes/Wire.md).[`map`](../classes/Wire.md#map)

***

### on()

> **on**\<`E`\>(`e`, `f`): `this`

Defined in: [index.ts:1159](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1159)

Declare a state transition: on each occurrence of `e`, fold the reducer
over the current value — `(state, event) => next`, `useReducer` order.
The occurrence and the wire's update share ONE moment (snapshot
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

Defined in: [index.ts:776](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L776)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

#### Inherited from

[`Wire`](../classes/Wire.md).[`retain`](../classes/Wire.md#retain)

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:726](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L726)

#### Returns

`A`

#### Inherited from

[`Wire`](../classes/Wire.md).[`sample`](../classes/Wire.md#sample)

***

### set()

> **set**(`a`): `void`

Defined in: [index.ts:1143](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1143)

Set the current value; equal values (by the cell's `eq`) are a no-op.

#### Parameters

##### a

`A`

#### Returns

`void`

***

### update()

> **update**(`f`): `void`

Defined in: [index.ts:1151](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1151)

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
