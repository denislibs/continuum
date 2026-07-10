[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Behavior

# Class: Behavior\<A\>

Defined in: [index.ts:514](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L514)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Behavior**\<`A`\>(`sampleNoTrans`, `updates`): `Behavior`\<`A`\>

Defined in: [index.ts:515](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L515)

#### Parameters

##### sampleNoTrans

() => `A`

Pull the current value without opening a transaction.

##### updates

[`Stream`](Stream.md)\<`A`\>

Push notifications of discrete changes (empty for continuous behaviors).

#### Returns

`Behavior`\<`A`\>

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:517](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L517)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:519](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L519)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:549](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L549)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:532](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L532)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Behavior`\<`B`\>

Defined in: [index.ts:527](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L527)

Pointwise transform (continuous-safe: recomputed on each sample).

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

`Behavior`\<`B`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:554](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L554)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:522](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L522)

#### Returns

`A`

***

### apply()

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Behavior`\<`B`\>

Defined in: [index.ts:562](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L562)

Applicative with coalescing: apply a behavior-of-function to a value.

#### Type Parameters

##### A

`A`

##### B

`B`

#### Parameters

##### bf

`Behavior`\<(`a`) => `B`\>

##### ba

`Behavior`\<`A`\>

#### Returns

`Behavior`\<`B`\>

***

### fromPoll()

> `static` **fromPoll**\<`A`\>(`poll`): `Behavior`\<`A`\>

Defined in: [index.ts:617](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L617)

Continuous behavior: sampled fresh on each read; no discrete updates.

#### Type Parameters

##### A

`A`

#### Parameters

##### poll

() => `A`

#### Returns

`Behavior`\<`A`\>

***

### lift2()

> `static` **lift2**\<`A`, `B`, `C`\>(`f`, `ba`, `bb`): `Behavior`\<`C`\>

Defined in: [index.ts:567](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L567)

Combine two behaviors pointwise; simultaneous updates coalesce once.

#### Type Parameters

##### A

`A`

##### B

`B`

##### C

`C`

#### Parameters

##### f

(`a`, `b`) => `C`

##### ba

`Behavior`\<`A`\>

##### bb

`Behavior`\<`B`\>

#### Returns

`Behavior`\<`C`\>

***

### lift3()

> `static` **lift3**\<`A`, `B`, `C`, `D`\>(`f`, `ba`, `bb`, `bc`): `Behavior`\<`D`\>

Defined in: [index.ts:602](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L602)

Combine three behaviors pointwise.

#### Type Parameters

##### A

`A`

##### B

`B`

##### C

`C`

##### D

`D`

#### Parameters

##### f

(`a`, `b`, `c`) => `D`

##### ba

`Behavior`\<`A`\>

##### bb

`Behavior`\<`B`\>

##### bc

`Behavior`\<`C`\>

#### Returns

`Behavior`\<`D`\>

***

### switchB()

> `static` **switchB**\<`A`\>(`bb`): `Behavior`\<`A`\>

Defined in: [index.ts:622](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L622)

Follow the behavior currently selected by an outer behavior.

#### Type Parameters

##### A

`A`

#### Parameters

##### bb

`Behavior`\<`Behavior`\<`A`\>\>

#### Returns

`Behavior`\<`A`\>

***

### switchE()

> `static` **switchE**\<`A`\>(`be`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:647](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L647)

Follow the event currently selected by a behavior.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`Behavior`\<[`Stream`](Stream.md)\<`A`\>\>

#### Returns

[`Stream`](Stream.md)\<`A`\>
