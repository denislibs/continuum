[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / StreamSource

# Interface: StreamSource\<A\>

Defined in: [index.ts:1163](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1163)

A source stream: occurrences enter the network via `.fire`.

## Extends

- [`Stream`](../classes/Stream.md)\<`A`\>

## Type Parameters

### A

`A`

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:315](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L315)

True once `dispose()` has run.

#### Inherited from

[`Stream`](../classes/Stream.md).[`disposed`](../classes/Stream.md#disposed)

***

### onSleep

> **onSleep**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:313](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L313)

**`Internal`**

Extra teardown run on sleep/dispose (flatten's inner subscription).

#### Inherited from

[`Stream`](../classes/Stream.md).[`onSleep`](../classes/Stream.md#onsleep)

***

### onWake

> **onWake**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:311](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L311)

**`Internal`**

Reseed hook run on wake, before inputs attach (lift caches).

#### Inherited from

[`Stream`](../classes/Stream.md).[`onWake`](../classes/Stream.md#onwake)

***

### rank

> **rank**: `number`

Defined in: [index.ts:285](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L285)

**`Internal`**

Topological height in the graph (propagation order).

#### Inherited from

[`Stream`](../classes/Stream.md).[`rank`](../classes/Stream.md#rank)

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Wire`](../classes/Wire.md)\<`B`\>

Defined in: [index.ts:596](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L596)

Fold occurrences into a behavior.

#### Type Parameters

##### B

`B`

#### Parameters

##### init

`B`

##### f

(`a`, `acc`) => `B`

#### Returns

[`Wire`](../classes/Wire.md)\<`B`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`accum`](../classes/Stream.md#accum)

***

### accumE()

> **accumE**\<`B`\>(`init`, `f`): [`Stream`](../classes/Stream.md)\<`B`\>

Defined in: [index.ts:570](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L570)

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

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:476](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L476)

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

Defined in: [index.ts:490](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L490)

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

Defined in: [index.ts:335](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L335)

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

Defined in: [index.ts:519](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L519)

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

Defined in: [index.ts:1165](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1165)

Fire one occurrence; each fire outside `batch` opens a fresh moment.

#### Parameters

##### a

`A`

#### Returns

`void`

***

### ~~gate()~~

> **gate**(`b`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:634](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L634)

#### Parameters

##### b

[`Wire`](../classes/Wire.md)\<`boolean`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Deprecated

Renamed to `when` — same semantics. Removed in 1.0.

#### Inherited from

[`Stream`](../classes/Stream.md).[`gate`](../classes/Stream.md#gate)

***

### hold()

> **hold**(`init`): [`Wire`](../classes/Wire.md)\<`A`\>

Defined in: [index.ts:541](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L541)

Step function: hold the last occurrence, committing at the moment
boundary. State — so it needs an owner: the process that keeps the value
current is registered in the ambient scope and detaches when the scope
disposes (the wire then answers with its final value).

#### Parameters

##### init

`A`

#### Returns

[`Wire`](../classes/Wire.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`hold`](../classes/Stream.md#hold)

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:692](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L692)

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

Defined in: [index.ts:378](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L378)

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

Defined in: [index.ts:509](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L509)

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

Defined in: [index.ts:515](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L515)

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

Defined in: [index.ts:605](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L605)

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

Defined in: [index.ts:481](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L481)

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

Defined in: [index.ts:639](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L639)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

[`Stream`](../classes/Stream.md)\<`A`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`or`](../classes/Stream.md#or)

***

### ~~orElse()~~

> **orElse**(`other`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:644](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L644)

#### Parameters

##### other

[`Stream`](../classes/Stream.md)\<`A`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Deprecated

Renamed to `or` — same semantics. Removed in 1.0.

#### Inherited from

[`Stream`](../classes/Stream.md).[`orElse`](../classes/Stream.md#orelse)

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:704](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L704)

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

Defined in: [index.ts:414](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L414)

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

### ~~snapshot()~~

> **snapshot**\<`B`, `C`\>(`b`, `f`): [`Stream`](../classes/Stream.md)\<`C`\>

Defined in: [index.ts:531](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L531)

#### Type Parameters

##### B

`B`

##### C

`C`

#### Parameters

##### b

[`Wire`](../classes/Wire.md)\<`B`\>

##### f

(`a`, `b`) => `C`

#### Returns

[`Stream`](../classes/Stream.md)\<`C`\>

#### Deprecated

Use `wire.at(stream, (value, event) => …)` — same semantics,
data first. Removed in 1.0.

#### Inherited from

[`Stream`](../classes/Stream.md).[`snapshot`](../classes/Stream.md#snapshot)

***

### source()

> **source**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:425](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L425)

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

Defined in: [index.ts:471](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L471)

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

### when()

> **when**(`b`): [`Stream`](../classes/Stream.md)\<`A`\>

Defined in: [index.ts:625](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L625)

Pass occurrences only while the wire is true.

#### Parameters

##### b

[`Wire`](../classes/Wire.md)\<`boolean`\>

#### Returns

[`Stream`](../classes/Stream.md)\<`A`\>

#### Inherited from

[`Stream`](../classes/Stream.md).[`when`](../classes/Stream.md#when)
