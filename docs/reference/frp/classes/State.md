[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / State

# Class: State\<A\>

Defined in: [index.ts:963](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L963)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Extended by

- [`StateSource`](../interfaces/StateSource.md)

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new State**\<`A`\>(`sampleNoTrans`, `updates`): `State`\<`A`\>

Defined in: [index.ts:964](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L964)

#### Parameters

##### sampleNoTrans

() => `A`

Pull the current value without opening a transaction.

##### updates

[`Stream`](Stream.md)\<`A`\>

Push notifications of discrete changes (empty for continuous behaviors).

#### Returns

`State`\<`A`\>

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:966](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L966)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:968](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L968)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:988](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L988)

Sample this state at each occurrence of `e`: `draft.at(submits)` is the
stream of the state's values as of those moments (pre-moment, with exact
simultaneity semantics). An optional combiner receives `(value, event)`.

##### Type Parameters

###### B

`B`

##### Parameters

###### e

[`Stream`](Stream.md)\<`B`\>

##### Returns

[`Stream`](Stream.md)\<`A`\>

#### Call Signature

> **at**\<`B`, `C`\>(`e`, `f`): [`Stream`](Stream.md)\<`C`\>

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

[`Stream`](Stream.md)\<`B`\>

###### f

(`value`, `event`) => `C`

##### Returns

[`Stream`](Stream.md)\<`C`\>

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:1016](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1016)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

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

***

### map()

> **map**\<`B`\>(`f`): `State`\<`B`\>

Defined in: [index.ts:979](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L979)

Pointwise transform (continuous-safe: recomputed on each sample).

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

`State`\<`B`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:1021](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1021)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:971](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L971)

#### Returns

`A`

***

### fromPoll()

> `static` **fromPoll**\<`A`\>(`poll`): `State`\<`A`\>

Defined in: [index.ts:1031](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1031)

Continuous behavior: sampled fresh on each read; no discrete updates.

#### Type Parameters

##### A

`A`

#### Parameters

##### poll

() => `A`

#### Returns

`State`\<`A`\>
