[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / State

# Class: State\<A\>

Defined in: [index.ts:981](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L981)

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

Defined in: [index.ts:982](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L982)

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

Defined in: [index.ts:984](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L984)

Pull the current value without opening a transaction.

#### Returns

`A`

***

### updates

> **updates**: [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:986](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L986)

Push notifications of discrete changes (empty for continuous behaviors).

## Methods

### at()

#### Call Signature

> **at**\<`B`\>(`e`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:1006](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1006)

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

Defined in: [index.ts:1007](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1007)

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

Defined in: [index.ts:1034](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1034)

Detach this behavior's `updates` from the graph (see `Stream.dispose`).

#### Returns

`void`

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:1017](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1017)

Deliver the current value immediately, then every change.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `State`\<`B`\>

Defined in: [index.ts:997](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L997)

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

Defined in: [index.ts:1039](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1039)

Keep this behavior's update chain alive across listener churn (see `Stream.retain`).

#### Returns

`this`

***

### sample()

> **sample**(): `A`

Defined in: [index.ts:989](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L989)

#### Returns

`A`

***

### ~~apply()~~

> `static` **apply**\<`A`, `B`\>(`bf`, `ba`): `State`\<`B`\>

Defined in: [index.ts:1047](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1047)

#### Type Parameters

##### A

`A`

##### B

`B`

#### Parameters

##### bf

`State`\<(`a`) => `B`\>

##### ba

`State`\<`A`\>

#### Returns

`State`\<`B`\>

#### Deprecated

Use `combine(bf, ba, (f, a) => f(a))`. Removed in 1.0.

***

### fromPoll()

> `static` **fromPoll**\<`A`\>(`poll`): `State`\<`A`\>

Defined in: [index.ts:1172](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1172)

Continuous behavior: sampled fresh on each read; no discrete updates.

#### Type Parameters

##### A

`A`

#### Parameters

##### poll

() => `A`

#### Returns

`State`\<`A`\>

***

### lift2()

> `static` **lift2**\<`A`, `B`, `C`\>(`f`, `ba`, `bb`): `State`\<`C`\>

Defined in: [index.ts:1055](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1055)

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

`State`\<`A`\>

##### bb

`State`\<`B`\>

#### Returns

`State`\<`C`\>

***

### ~~lift3()~~

> `static` **lift3**\<`A`, `B`, `C`, `D`\>(`f`, `ba`, `bb`, `bc`): `State`\<`D`\>

Defined in: [index.ts:1161](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1161)

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

`State`\<`A`\>

##### bb

`State`\<`B`\>

##### bc

`State`\<`C`\>

#### Returns

`State`\<`D`\>

#### Deprecated

Use `combine(a, b, c, f)`. Removed in 1.0.

***

### switchB()

> `static` **switchB**\<`A`\>(`bb`): `State`\<`A`\>

Defined in: [index.ts:1184](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1184)

**`Internal`**

The state-of-states switch behind `flatten`. Public under the
deprecated `switchB` name until 1.0 — prefer `flatten(w)`.

A formula: cold it is a recipe (pull samples straight through); waking
attaches the outer state AND the currently selected inner; sleeping
detaches both. Rewiring while warm commits at the moment boundary.

#### Type Parameters

##### A

`A`

#### Parameters

##### bb

`State`\<`State`\<`A`\>\>

#### Returns

`State`\<`A`\>

***

### switchE()

> `static` **switchE**\<`A`\>(`be`): [`Stream`](Stream.md)\<`A`\>

Defined in: [index.ts:1225](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L1225)

**`Internal`**

The state-of-streams switch behind `flatten`. Public under the
deprecated `switchE` name until 1.0 — prefer `flatten(w)`.

A formula (see switchB): waking attaches the CURRENT selection, even
one chosen while asleep.

#### Type Parameters

##### A

`A`

#### Parameters

##### be

`State`\<[`Stream`](Stream.md)\<`A`\>\>

#### Returns

[`Stream`](Stream.md)\<`A`\>
