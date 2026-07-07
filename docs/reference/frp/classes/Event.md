[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Event

# Class: Event\<A\>

Defined in: [index.ts:154](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L154)

Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
one occurrence per moment — simultaneous inputs coalesce (see `merge`).

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Event**\<`A`\>(`rank?`): `Event`\<`A`\>

Defined in: [index.ts:171](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L171)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Event`\<`A`\>

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:167](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L167)

True once `dispose()` has run.

***

### rank

> **rank**: `number`

Defined in: [index.ts:156](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L156)

**`Internal`**

Topological height in the graph (propagation order).

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Behavior`](Behavior.md)\<`B`\>

Defined in: [index.ts:349](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L349)

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

[`Behavior`](Behavior.md)\<`B`\>

***

### accumE()

> **accumE**\<`B`\>(`init`, `f`): `Event`\<`B`\>

Defined in: [index.ts:340](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L340)

Fold occurrences into a stream of accumulated states.

#### Type Parameters

##### B

`B`

#### Parameters

##### init

`B`

##### f

(`a`, `acc`) => `B`

#### Returns

`Event`\<`B`\>

***

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:263](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L263)

**`Internal`**

Subscribe to `input` and register the teardown for `dispose()`.

#### Type Parameters

##### X

`X`

#### Parameters

##### input

`Event`\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:277](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L277)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`, `visited`): `void`

Defined in: [index.ts:180](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L180)

**`Internal`**

Raise this node's rank above `limit` and propagate the bump
downstream, so a node never has a rank ≤ one of its inputs. Detects
dependency cycles.

#### Parameters

##### limit

`number`

##### visited

`Set`\<`Event`\<`any`\>\>

#### Returns

`void`

***

### filter()

> **filter**(`pred`): `Event`\<`A`\>

Defined in: [index.ts:299](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L299)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Event`\<`A`\>

***

### gate()

> **gate**(`b`): `Event`\<`A`\>

Defined in: [index.ts:368](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L368)

Pass occurrences only while the behavior is true.

#### Parameters

##### b

[`Behavior`](Behavior.md)\<`boolean`\>

#### Returns

`Event`\<`A`\>

***

### hold()

> **hold**(`init`): [`Behavior`](Behavior.md)\<`A`\>

Defined in: [index.ts:315](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L315)

Step function: hold the last occurrence, committing at the moment boundary.

#### Parameters

##### init

`A`

#### Returns

[`Behavior`](Behavior.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:425](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L425)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:203](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L203)

**`Internal`**

Register an in-graph subscriber. Returns an unsubscribe handle.

#### Parameters

##### target

`Event`\<`any`\> \| `null`

##### h

`Handler`\<`A`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### map()

> **map**\<`B`\>(`f`): `Event`\<`B`\>

Defined in: [index.ts:289](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L289)

#### Type Parameters

##### B

`B`

#### Parameters

##### f

(`a`) => `B`

#### Returns

`Event`\<`B`\>

***

### mapTo()

> **mapTo**\<`B`\>(`b`): `Event`\<`B`\>

Defined in: [index.ts:295](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L295)

#### Type Parameters

##### B

`B`

#### Parameters

##### b

`B`

#### Returns

`Event`\<`B`\>

***

### once()

> **once**(): `Event`\<`A`\>

Defined in: [index.ts:354](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L354)

Only the first occurrence passes.

#### Returns

`Event`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:268](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L268)

**`Internal`**

Register an extra teardown to run on `dispose()`.

#### Parameters

##### fn

() => `void`

#### Returns

`void`

***

### orElse()

> **orElse**(`other`): `Event`\<`A`\>

Defined in: [index.ts:377](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L377)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Event`\<`A`\>

#### Returns

`Event`\<`A`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:450](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L450)

Keep this node alive when its last listener unsubscribes. Derived nodes
normally auto-dispose at that point (so per-component derivations don't
leak onto long-lived sources); call `retain()` on a derivation you
intentionally share across mounts (e.g. a module-level one).

#### Returns

`this`

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:238](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L238)

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

### snapshot()

> **snapshot**\<`B`, `C`\>(`b`, `f`): `Event`\<`C`\>

Defined in: [index.ts:308](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L308)

Sample a behavior at the instant of each occurrence (sees pre-moment value).

#### Type Parameters

##### B

`B`

##### C

`C`

#### Parameters

##### b

[`Behavior`](Behavior.md)\<`B`\>

##### f

(`a`, `b`) => `C`

#### Returns

`Event`\<`C`\>

***

### subscribe()

> **subscribe**\<`X`\>(`input`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:248](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L248)

**`Internal`**

Subscribe this node to `input`, returning a teardown that also
cascades: if `input` is a derived node left with no listeners, it disposes
too. Sources (no cleanups of their own) are never auto-disposed.

#### Type Parameters

##### X

`X`

#### Parameters

##### input

`Event`\<`X`\>

##### h

`Handler`\<`X`\>

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### merge()

> `static` **merge**\<`A`\>(`ea`, `eb`, `combine`): `Event`\<`A`\>

Defined in: [index.ts:382](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L382)

Merge two events; simultaneous occurrences coalesce once via `combine`.

#### Type Parameters

##### A

`A`

#### Parameters

##### ea

`Event`\<`A`\>

##### eb

`Event`\<`A`\>

##### combine

(`l`, `r`) => `A`

#### Returns

`Event`\<`A`\>
