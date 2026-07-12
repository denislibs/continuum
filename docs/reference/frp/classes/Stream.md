[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Stream

# Class: Stream\<A\>

Defined in: [index.ts:304](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L304)

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

Defined in: [index.ts:337](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L337)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Stream`\<`A`\>

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:333](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L333)

True once `dispose()` has run.

***

### onSleep

> **onSleep**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:331](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L331)

**`Internal`**

Extra teardown run on sleep/dispose (flatten's inner subscription).

***

### onWake

> **onWake**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:329](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L329)

**`Internal`**

Reseed hook run on wake, before inputs attach (lift caches).

***

### rank

> **rank**: `number`

Defined in: [index.ts:306](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L306)

**`Internal`**

Topological height in the graph (propagation order).

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Wire`](Wire.md)\<`B`\>

Defined in: [index.ts:637](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L637)

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

[`Wire`](Wire.md)\<`B`\>

***

### accumE()

> **accumE**\<`B`\>(`init`, `f`): `Stream`\<`B`\>

Defined in: [index.ts:611](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L611)

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

> **attach\_**(`target`, `h`): `Edge`\<`A`\>

Defined in: [index.ts:406](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L406)

**`Internal`**

Closure-free subscription: returns the edge record.

#### Parameters

##### target

`Stream`\<`any`\> \| `null`

##### h

`Handler`\<`A`\>

#### Returns

`Edge`\<`A`\>

***

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:515](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L515)

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

Defined in: [index.ts:529](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L529)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`): `void`

Defined in: [index.ts:353](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L353)

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

Defined in: [index.ts:560](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L560)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Stream`\<`A`\>

***

### ~~gate()~~

> **gate**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:675](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L675)

#### Parameters

##### b

[`Wire`](Wire.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

#### Deprecated

Renamed to `when` — same semantics. Removed in 1.0.

***

### hold()

> **hold**(`init`): [`Wire`](Wire.md)\<`A`\>

Defined in: [index.ts:582](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L582)

Step function: hold the last occurrence, committing at the moment
boundary. State — so it needs an owner: the process that keeps the value
current is registered in the ambient scope and detaches when the scope
disposes (the wire then answers with its final value).

#### Parameters

##### init

`A`

#### Returns

[`Wire`](Wire.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:733](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L733)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:400](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L400)

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

Defined in: [index.ts:550](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L550)

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

Defined in: [index.ts:556](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L556)

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

Defined in: [index.ts:646](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L646)

Only the first occurrence passes. A formula: cold occurrences nobody
observed do not spend it; once it fired while warm, the flag persists
across sleep (an observed occurrence stays observed).

#### Returns

`Stream`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:520](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L520)

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

Defined in: [index.ts:680](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L680)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Stream`\<`A`\>

#### Returns

`Stream`\<`A`\>

***

### ~~orElse()~~

> **orElse**(`other`): `Stream`\<`A`\>

Defined in: [index.ts:685](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L685)

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

Defined in: [index.ts:745](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L745)

Performance hint: keep a pure derivation attached across listener churn
instead of sleeping and re-waking (useful for a hot shared chain whose
listeners come and go). Never required for correctness.

#### Returns

`this`

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:440](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L440)

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

Defined in: [index.ts:572](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L572)

#### Type Parameters

##### B

`B`

##### C

`C`

#### Parameters

##### b

[`Wire`](Wire.md)\<`B`\>

##### f

(`a`, `b`) => `C`

#### Returns

`Stream`\<`C`\>

#### Deprecated

Use `wire.at(stream, (value, event) => …)` — same semantics,
data first. Removed in 1.0.

***

### source()

> **source**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:453](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L453)

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

Defined in: [index.ts:510](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L510)

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

Defined in: [index.ts:426](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L426)

**`Internal`**

O(1) edge removal: swap with the last, fix its index.

#### Parameters

##### rec

`Edge`\<`A`\>

#### Returns

`void`

***

### when()

> **when**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:666](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L666)

Pass occurrences only while the wire is true.

#### Parameters

##### b

[`Wire`](Wire.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

***

### merge()

> `static` **merge**\<`A`\>(`ea`, `eb`, `combine`): `Stream`\<`A`\>

Defined in: [index.ts:690](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L690)

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
