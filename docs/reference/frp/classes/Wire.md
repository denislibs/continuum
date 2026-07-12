[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Wire

# Class: Wire\<A\>

Defined in: [index.ts:718](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L718)

A value across time (pull) with discrete change notifications (push).
Denotationally `Time → A`: it always has a value — `sample()` never misses.

## Extended by

- [`WireSource`](../interfaces/WireSource.md)

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Wire**\<`A`\>(`sampleNoTrans`, `updates`): `Wire`\<`A`\>

Defined in: [index.ts:719](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L719)

#### Parameters

##### sampleNoTrans

() => `A`

Pull the current value without opening a transaction.

##### updates

[`Stream`](Stream.md)\<`A`\>

Push notifications of discrete changes (empty for continuous behaviors).

#### Returns

`Wire`\<`A`\>

## Properties

### sampleNoTrans

> **sampleNoTrans**: () => `A`

Defined in: [index.ts:721](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L721)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:723](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L723)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:743](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L743)

Sample this wire at each occurrence of `e`: `draft.at(submits)` is the
stream of the wire's values as of those moments (pre-moment, with exact
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

[`Stream`](Stream.md)\<`B`\>

###### f

(`value`, `event`) => `C`

##### Returns

[`Stream`](Stream.md)\<`C`\>

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:771](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L771)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

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

***

### map()

> **map**\<`B`\>(`f`): `Wire`\<`B`\>

Defined in: [index.ts:734](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L734)

Pointwise transform (continuous-safe: recomputed on each sample).

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

`Wire`\<`B`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:776](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L776)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:726](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L726)

#### Returns

`A`

***

### ~~apply()~~

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Wire`\<`B`\>

Defined in: [index.ts:784](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L784)

#### Type Parameters

##### A

`A`

##### B

`B`

#### Parameters

##### bf

`Wire`\<(`a`) => `B`\>

##### ba

`Wire`\<`A`\>

#### Returns

`Wire`\<`B`\>

#### Deprecated

Use `combine(bf, ba, (f, a) => f(a))`. Removed in 1.0.

***

### fromPoll()

> `static` **fromPoll**\<`A`\>(`poll`): `Wire`\<`A`\>

Defined in: [index.ts:906](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L906)

Continuous behavior: sampled fresh on each read; no discrete updates.

#### Type Parameters

##### A

`A`

#### Parameters

##### poll

() => `A`

#### Returns

`Wire`\<`A`\>

***

### lift2()

> `static` **lift2**\<`A`, `B`, `C`\>(`f`, `ba`, `bb`): `Wire`\<`C`\>

Defined in: [index.ts:792](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L792)

**`Internal`**

The two-input join every `combine` reduces to. Public under the
deprecated `lift2` name until 1.0 — prefer `combine(a, b, f)`.

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

`Wire`\<`A`\>

##### bb

`Wire`\<`B`\>

#### Returns

`Wire`\<`C`\>

***

### ~~lift3()~~

> `static` **lift3**\<`A`, `B`, `C`, `D`\>(`f`, `ba`, `bb`, `bc`): `Wire`\<`D`\>

Defined in: [index.ts:895](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L895)

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

`Wire`\<`A`\>

##### bb

`Wire`\<`B`\>

##### bc

`Wire`\<`C`\>

#### Returns

`Wire`\<`D`\>

#### Deprecated

Use `combine(a, b, c, f)`. Removed in 1.0.

***

### switchB()

> `static` **switchB**\<`A`\>(`bb`): `Wire`\<`A`\>

Defined in: [index.ts:918](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L918)

**`Internal`**

The wire-of-wires switch behind `flatten`. Public under the
deprecated `switchB` name until 1.0 — prefer `flatten(w)`.

A formula: cold it is a recipe (pull samples straight through); waking
attaches the outer wire AND the currently selected inner; sleeping
detaches both. Rewiring while warm commits at the moment boundary.

#### Type Parameters

##### A

`A`

#### Parameters

##### bb

`Wire`\<`Wire`\<`A`\>\>

#### Returns

`Wire`\<`A`\>

***

### switchE()

> `static` **switchE**\<`A`\>(`be`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:959](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L959)

**`Internal`**

The wire-of-streams switch behind `flatten`. Public under the
deprecated `switchE` name until 1.0 — prefer `flatten(w)`.

A formula (see switchB): waking attaches the CURRENT selection, even
one chosen while asleep.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`Wire`\<[`Stream`](Stream.md)\<`A`\>\>

#### Returns

[`Stream`](Stream.md)\<`A`\>
