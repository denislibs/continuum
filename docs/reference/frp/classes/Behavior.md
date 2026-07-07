[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Behavior

# Class: Behavior\<A\>

Defined in: [index.ts:487](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L487)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Behavior**\<`A`\>(`sampleNoTrans`, `updates`): `Behavior`\<`A`\>

Defined in: [index.ts:488](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L488)

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

Defined in: [index.ts:490](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L490)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Event`](Event.md)\<`A`\>

Defined in: [index.ts:492](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L492)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:522](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L522)

Detach this behavior's `updates` from the graph (see `Event.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:505](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L505)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Behavior`\<`B`\>

Defined in: [index.ts:500](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L500)

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

Defined in: [index.ts:527](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L527)

Keep this behavior's update chain alive across listener churn (see `Event.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:495](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L495)

#### Returns

`A`

***

### apply()

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Behavior`\<`B`\>

Defined in: [index.ts:535](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L535)

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

Defined in: [index.ts:590](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L590)

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

Defined in: [index.ts:540](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L540)

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

Defined in: [index.ts:575](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L575)

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

Defined in: [index.ts:595](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L595)

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

Defined in: [index.ts:620](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/frp/src/index.ts#L620)

Follow the event currently selected by a behavior.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`Behavior`\<[`Event`](Event.md)\<`A`\>\>

#### Returns

[`Event`](Event.md)\<`A`\>
