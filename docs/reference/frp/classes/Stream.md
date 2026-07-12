[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Stream

# Class: Stream\<A\>

Defined in: [index.ts:410](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L410)

Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
one occurrence per moment — simultaneous inputs coalesce (see `merge`).

## Extended by

- [`StreamSource`](../interfaces/StreamSource.md)

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Stream**\<`A`\>(`rank?`): `Stream`\<`A`\>

Defined in: [index.ts:456](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L456)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Stream`\<`A`\>

## Properties

### onSleep

> **onSleep**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:447](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L447)

**`Internal`**

Extra teardown run on sleep/dispose (flatten's inner subscription).

***

### onWake

> **onWake**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:445](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L445)

**`Internal`**

Reseed hook run on wake, before inputs attach (lift caches).

***

### rank

> **rank**: `number`

Defined in: [index.ts:412](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L412)

**`Internal`**

Topological height in the graph (propagation order).

## Accessors

### disposed

#### Get Signature

> **get** **disposed**(): `boolean`

Defined in: [index.ts:452](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L452)

True once `dispose()` has run.

##### Returns

`boolean`

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`State`](State.md)\<`B`\>

Defined in: [index.ts:828](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L828)

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

[`State`](State.md)\<`B`\>

***

### accumE()

> **accumE**\<`B`\>(`init`, `f`): `Stream`\<`B`\>

Defined in: [index.ts:797](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L797)

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

`Stream`\<`B`\>

***

### attach\_()

> **attach\_**(`target`, `h`): [`Edge`](../interfaces/Edge.md)\<`any`\>

Defined in: [index.ts:536](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L536)

**`Internal`**

Closure-free subscription: returns the edge record. The
handler kind must match the target (Observer for POST, Handler else) —
see the Edge discriminant.

#### Parameters

##### target

`Stream`\<`any`\> \| `null`

##### h

`Handler`\<`A`\> \| `Observer`\<`A`\>

#### Returns

[`Edge`](../interfaces/Edge.md)\<`any`\>

***

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:696](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L696)

**`Internal`**

Subscribe to `input` and register the teardown for `dispose()`.

#### Type Parameters

##### X

`X`

#### Parameters

##### input

`Stream`\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:710](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L710)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`): `void`

Defined in: [index.ts:472](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L472)

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

***

### filter()

> **filter**(`pred`): `Stream`\<`A`\>

Defined in: [index.ts:742](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L742)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Stream`\<`A`\>

***

### ~~gate()~~

> **gate**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:889](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L889)

#### Parameters

##### b

[`State`](State.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

#### Deprecated

Renamed to `when` — same semantics. Removed in 1.0.

***

### hold()

> **hold**(`init`): [`State`](State.md)\<`A`\>

Defined in: [index.ts:764](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L764)

Step function: hold the last occurrence, committing at the moment
boundary. State — so it needs an owner: the process that keeps the value
current is registered in the ambient scope and detaches when the scope
disposes (the state then answers with its final value).

#### Parameters

##### init

`A`

#### Returns

[`State`](State.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:947](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L947)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:528](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L528)

**`Internal`**

Register an in-graph subscriber. Returns an unsubscribe handle.

#### Parameters

##### target

`Stream`\<`any`\> \| `null`

##### h

`Handler`\<`A`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Stream`\<`B`\>

Defined in: [index.ts:732](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L732)

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

`Stream`\<`B`\>

***

### mapTo()

> **mapTo**\<`B`\>(`b`): `Stream`\<`B`\>

Defined in: [index.ts:738](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L738)

#### Type Parameters

##### B

`B`

#### Parameters

##### b

`B`

#### Returns

`Stream`\<`B`\>

***

### once()

> **once**(): `Stream`\<`A`\>

Defined in: [index.ts:858](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L858)

Only the first occurrence passes. A formula: cold occurrences nobody
observed do not spend it; once it fired while warm, the flag persists
across sleep (an observed occurrence stays observed).

#### Returns

`Stream`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:701](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L701)

**`Internal`**

Register an extra teardown to run on `dispose()`.

#### Parameters

##### fn

() => `void`

#### Returns

`void`

***

### or()

> **or**(`other`): `Stream`\<`A`\>

Defined in: [index.ts:894](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L894)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Stream`\<`A`\>

#### Returns

`Stream`\<`A`\>

***

### ~~orElse()~~

> **orElse**(`other`): `Stream`\<`A`\>

Defined in: [index.ts:899](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L899)

#### Parameters

##### other

`Stream`\<`A`\>

#### Returns

`Stream`\<`A`\>

#### Deprecated

Renamed to `or` — same semantics. Removed in 1.0.

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:960](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L960)

Performance hint: keep a pure derivation attached across listener churn
instead of sleeping and re-waking (useful for a hot shared chain whose
listeners come and go). Never required for correctness.

#### Returns

`this`

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:594](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L594)

**`Internal`**

Push an occurrence to every current subscriber.

#### Parameters

##### t

[`Transaction`](Transaction.md)

##### a

`A`

#### Returns

`void`

***

### ~~snapshot()~~

> **snapshot**\<`B`, `C`\>(`b`, `f`): `Stream`\<`C`\>

Defined in: [index.ts:754](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L754)

#### Type Parameters

##### B

`B`

##### C

`C`

#### Parameters

##### b

[`State`](State.md)\<`B`\>

##### f

(`a`, `b`) => `C`

#### Returns

`Stream`\<`C`\>

#### Deprecated

Use `state.at(stream, (value, event) => …)` — same semantics,
data first. Removed in 1.0.

***

### source()

> **source**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:622](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L622)

**`Internal`**

Register a lazy input (see `srcs`).

#### Type Parameters

##### X

`X`

#### Parameters

##### input

`Stream`\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

`void`

***

### subscribe()

> **subscribe**\<`X`\>(`input`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:691](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L691)

**`Internal`**

Subscribe this node to `input` (rank-tracked).

#### Type Parameters

##### X

`X`

#### Parameters

##### input

`Stream`\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### unlisten\_()

> **unlisten\_**(`rec`): `void`

Defined in: [index.ts:574](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L574)

**`Internal`**

O(1) edge removal: clear the inline slot, or swap with the
array's last edge and fix its index.

#### Parameters

##### rec

[`Edge`](../interfaces/Edge.md)\<`any`\>

#### Returns

`void`

***

### when()

> **when**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:880](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L880)

Pass occurrences only while the state is true.

#### Parameters

##### b

[`State`](State.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

***

### merge()

> `static` **merge**\<`A`\>(`ea`, `eb`, `combine`): `Stream`\<`A`\>

Defined in: [index.ts:904](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/frp/src/index.ts#L904)

Merge two events; simultaneous occurrences coalesce once via `combine`.

#### Type Parameters

##### A

`A`

#### Parameters

##### ea

`Stream`\<`A`\>

##### eb

`Stream`\<`A`\>

##### combine

(`l`, `r`) => `A`

#### Returns

`Stream`\<`A`\>
