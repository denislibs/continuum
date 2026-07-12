[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Wire

# Class: Wire\<A\>

Defined in: [index.ts:759](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L759)

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

Defined in: [index.ts:760](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L760)

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

Defined in: [index.ts:762](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L762)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:764](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L764)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:784](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L784)

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

Defined in: [index.ts:785](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L785)

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

Defined in: [index.ts:812](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L812)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:795](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L795)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Wire`\<`B`\>

Defined in: [index.ts:775](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L775)

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

Defined in: [index.ts:817](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L817)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:767](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L767)

#### Returns

`A`

***

### ~~apply()~~

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `Wire`\<`B`\>

Defined in: [index.ts:825](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L825)

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

Defined in: [index.ts:947](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L947)

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

Defined in: [index.ts:833](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L833)

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

Defined in: [index.ts:936](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L936)

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

Defined in: [index.ts:959](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L959)

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

Defined in: [index.ts:1000](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1000)

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
