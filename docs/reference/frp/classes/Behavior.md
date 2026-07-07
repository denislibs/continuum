[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Behavior

# Class: Behavior\<A\>

Defined in: [index.ts:464](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L464)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Behavior**\<`A`\>(`sampleNoTrans`, `updates`): `Behavior`\<`A`\>

Defined in: [index.ts:465](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L465)

#### Parameters

##### sampleNoTrans

() => `A`

Pull the current value without opening a transaction.

##### updates

[`Event`](Event.md)\<`A`\>

Push notifications of discrete changes (empty for continuous behaviors).

#### Returns

`Behavior`\<`A`\>

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:467](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L467)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Event`](Event.md)\<`A`\>

Defined in: [index.ts:469](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L469)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:499](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L499)

Detach this behavior's `updates` from the graph (see `Event.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:482](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L482)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Behavior`\<`B`\>

Defined in: [index.ts:477](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L477)

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

Defined in: [index.ts:504](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L504)

Keep this behavior's update chain alive across listener churn (see `Event.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:472](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L472)

#### Returns

`A`

***

### apply()

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Behavior`\<`B`\>

Defined in: [index.ts:512](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L512)

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

Defined in: [index.ts:567](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L567)

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

Defined in: [index.ts:517](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L517)

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

Defined in: [index.ts:552](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L552)

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

Defined in: [index.ts:572](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L572)

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

> `static` **switchE**\<`A`\>(`be`): [`Event`](Event.md)\<`A`\>

Defined in: [index.ts:597](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/frp/src/index.ts#L597)

Follow the event currently selected by a behavior.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`Behavior`\<[`Event`](Event.md)\<`A`\>\>

#### Returns

[`Event`](Event.md)\<`A`\>
