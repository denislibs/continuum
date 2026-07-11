[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Behavior

# Class: Behavior\<A\>

Defined in: [index.ts:612](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L612)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Behavior**\<`A`\>(`sampleNoTrans`, `updates`): `Behavior`\<`A`\>

Defined in: [index.ts:613](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L613)

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

Defined in: [index.ts:615](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L615)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:617](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L617)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:647](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L647)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:630](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L630)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Behavior`\<`B`\>

Defined in: [index.ts:625](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L625)

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

Defined in: [index.ts:652](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L652)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:620](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L620)

#### Returns

`A`

***

### apply()

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Behavior`\<`B`\>

Defined in: [index.ts:660](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L660)

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

Defined in: [index.ts:723](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L723)

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

Defined in: [index.ts:665](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L665)

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

Defined in: [index.ts:708](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L708)

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

Defined in: [index.ts:728](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L728)

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

Defined in: [index.ts:755](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L755)

Follow the event currently selected by a behavior.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`Behavior`\<[`Stream`](Stream.md)\<`A`\>\>

#### Returns

[`Stream`](Stream.md)\<`A`\>
