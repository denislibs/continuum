[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / StreamSource

# Interface: StreamSource\<A\>

Defined in: [index.ts:1426](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1426)

A source stream: occurrences enter the network via `.fire`.

## Extends

- [`Stream`](../classes/Stream.md)\<`A`\>

## Type Parameters

### A

`A`

## Properties

### onSleep

> **onSleep**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:447](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L447)

**`Internal`**

Extra teardown run on sleep/dispose (flatten's inner subscription).

#### Inherited from

[`Stream`](../classes/Stream.md).[`onSleep`](../classes/Stream.md#onsleep)

***

### onWake

> **onWake**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:445](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L445)

**`Internal`**

Reseed hook run on wake, before inputs attach (lift caches).

#### Inherited from

[`Stream`](../classes/Stream.md).[`onWake`](../classes/Stream.md#onwake)

***

### rank

> **rank**: `number`

Defined in: [index.ts:412](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L412)

**`Internal`**

Topological height in the graph (propagation order).

#### Inherited from

[`Stream`](../classes/Stream.md).[`rank`](../classes/Stream.md#rank)

## Accessors

### disposed

#### Get Signature

> **get** **disposed**(): `boolean`

Defined in: [index.ts:452](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L452)

True once `dispose()` has run.

##### Returns

`boolean`

#### Inherited from

[`Stream`](../classes/Stream.md).[`disposed`](../classes/Stream.md#disposed)

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`State`](../classes/State.md)\<`B`\>

Defined in: [index.ts:820](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L820)

Fold occurrences into a behavior. Fused: one node and one edge instead
of the accumE + hold pair — every counter in every app pays half.

#### Type Parameters

##### B

`B`

#### Parameters

##### init

`B`

##### f

(`a`, `acc`) => `B`

#### Returns

[`State`](../classes/State.md)\<`B`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`accum`](../classes/Stream.md#accum)

***

### accumE()

> **accumE**\<`B`\>(`init`, `f`): [`Stream`](../classes/Stream.md)\<`B`\>

Defined in: [index.ts:789](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L789)

Fold occurrences into a stream of accumulated states. State — the fold
process belongs to the ambient scope (see `hold`).

#### Type Parameters

##### B

`B`

#### Parameters

##### init

`B`

##### f

(`a`, `acc`) => `B`

#### Returns

[`Stream`](../classes/Stream.md)\<`B`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`accumE`](../classes/Stream.md#accume)

***

### attach\_()

> **attach\_**(`target`, `h`): [`Edge`](Edge.md)\<`any`\>

Defined in: [index.ts:536](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L536)

**`Internal`**

Closure-free subscription: returns the edge record. The
handler kind must match the target (Observer for POST, Handler else) —
see the Edge discriminant.

#### Parameters

##### target

[`Stream`](../classes/Stream.md)\<`any`\> \| `null`

##### h

`Handler`\<`A`\> \| `Observer`\<`A`\>

#### Returns

[`Edge`](Edge.md)\<`any`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`attach_`](../classes/Stream.md#attach_)

***

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:696](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L696)

**`Internal`**

Subscribe to `input` and register the teardown for `dispose()`.

#### Type Parameters

##### X

`X`

#### Parameters

##### input

[`Stream`](../classes/Stream.md)\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`consume`](../classes/Stream.md#consume)

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:710](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L710)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`dispose`](../classes/Stream.md#dispose)

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`): `void`

Defined in: [index.ts:472](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L472)

**`Internal`**

Raise this node's rank above `limit` and propagate the bump
downstream, so a node never has a rank ≤ one of its inputs. Detects
dependency cycles.

Iterative on an explicit stack: a bump cascades through the entire
downstream chain, and a deep chain must not overflow the call stack.
`onPath` mirrors the recursion's path-tracking: a node met twice on ONE
dfs path is a cycle; met again on a sibling path (a diamond) it is
either already high enough (fast path) or bumped once more — same as
the recursive formulation.

#### Parameters

##### limit

`number`

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`ensureBiggerThan`](../classes/Stream.md#ensurebiggerthan)

***

### filter()

> **filter**(`pred`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:742](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L742)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`filter`](../classes/Stream.md#filter)

***

### fire()

> **fire**(`a`): `void`

Defined in: [index.ts:1428](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1428)

Fire one occurrence; each fire outside `batch` opens a fresh moment.

#### Parameters

##### a

`A`

#### Returns

`void`

***

### hold()

> **hold**(`init`): [`State`](../classes/State.md)\<`A`\>

Defined in: [index.ts:756](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L756)

Step function: hold the last occurrence, committing at the moment
boundary. State — so it needs an owner: the process that keeps the value
current is registered in the ambient scope and detaches when the scope
disposes (the state then answers with its final value).

#### Parameters

##### init

`A`

#### Returns

[`State`](../classes/State.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`hold`](../classes/Stream.md#hold)

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:929](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L929)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

#### Inherited from

[`Stream`](../classes/Stream.md).[`listen`](../classes/Stream.md#listen)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:528](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L528)

**`Internal`**

Register an in-graph subscriber. Returns an unsubscribe handle.

#### Parameters

##### target

[`Stream`](../classes/Stream.md)\<`any`\> \| `null`

##### h

`Handler`\<`A`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

#### Inherited from

[`Stream`](../classes/Stream.md).[`listen_`](../classes/Stream.md#listen_)

***

### map()

> **map**\<`B`\>(`f`): [`Stream`](../classes/Stream.md)\<`B`\>

Defined in: [index.ts:732](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L732)

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

[`Stream`](../classes/Stream.md)\<`B`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`map`](../classes/Stream.md#map)

***

### mapTo()

> **mapTo**\<`B`\>(`b`): [`Stream`](../classes/Stream.md)\<`B`\>

Defined in: [index.ts:738](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L738)

#### Type Parameters

##### B

`B`

#### Parameters

##### b

`B`

#### Returns

[`Stream`](../classes/Stream.md)\<`B`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`mapTo`](../classes/Stream.md#mapto)

***

### once()

> **once**(): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:850](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L850)

Only the first occurrence passes. A formula: cold occurrences nobody
observed do not spend it; once it fired while warm, the flag persists
across sleep (an observed occurrence stays observed).

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`once`](../classes/Stream.md#once)

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:701](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L701)

**`Internal`**

Register an extra teardown to run on `dispose()`.

#### Parameters

##### fn

() => `void`

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`onDispose`](../classes/Stream.md#ondispose)

***

### or()

> **or**(`other`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:881](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L881)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

[`Stream`](../classes/Stream.md)\<`A`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`or`](../classes/Stream.md#or)

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:942](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L942)

Performance hint: keep a pure derivation attached across listener churn
instead of sleeping and re-waking (useful for a hot shared chain whose
listeners come and go). Never required for correctness.

#### Returns

`this`

#### Inherited from

[`Stream`](../classes/Stream.md).[`retain`](../classes/Stream.md#retain)

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:594](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L594)

**`Internal`**

Push an occurrence to every current subscriber.

#### Parameters

##### t

[`Transaction`](../classes/Transaction.md)

##### a

`A`

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`send_`](../classes/Stream.md#send_)

***

### source()

> **source**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:622](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L622)

**`Internal`**

Register a lazy input (see `srcs`).

#### Type Parameters

##### X

`X`

#### Parameters

##### input

[`Stream`](../classes/Stream.md)\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`source`](../classes/Stream.md#source)

***

### subscribe()

> **subscribe**\<`X`\>(`input`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:691](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L691)

**`Internal`**

Subscribe this node to `input` (rank-tracked).

#### Type Parameters

##### X

`X`

#### Parameters

##### input

[`Stream`](../classes/Stream.md)\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

#### Inherited from

[`Stream`](../classes/Stream.md).[`subscribe`](../classes/Stream.md#subscribe)

***

### unlisten\_()

> **unlisten\_**(`rec`): `void`

Defined in: [index.ts:574](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L574)

**`Internal`**

O(1) edge removal: clear the inline slot, or swap with the
array's last edge and fix its index.

#### Parameters

##### rec

[`Edge`](Edge.md)\<`any`\>

#### Returns

`void`

#### Inherited from

[`Stream`](../classes/Stream.md).[`unlisten_`](../classes/Stream.md#unlisten_)

***

### when()

> **when**(`b`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:872](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L872)

Pass occurrences only while the state is true.

#### Parameters

##### b

[`State`](../classes/State.md)\<`boolean`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`when`](../classes/Stream.md#when)
