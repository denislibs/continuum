[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Event

# Class: Event\<A\>

Defined in: [index.ts:150](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L150)

Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
one occurrence per moment — simultaneous inputs coalesce (see `merge`).

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Event**\<`A`\>(`rank?`): `Event`\<`A`\>

Defined in: [index.ts:161](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L161)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Event`\<`A`\>

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:159](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L159)

True once `dispose()` has run.

***

### rank

> **rank**: `number`

Defined in: [index.ts:152](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L152)

**`Internal`**

Topological height in the graph (propagation order).

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Behavior`](Behavior.md)\<`B`\>

Defined in: [index.ts:303](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L303)

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

Defined in: [index.ts:294](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L294)

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

Defined in: [index.ts:217](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L217)

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

Defined in: [index.ts:231](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L231)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`, `visited`): `void`

Defined in: [index.ts:170](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L170)

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

Defined in: [index.ts:253](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L253)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Event`\<`A`\>

***

### gate()

> **gate**(`b`): `Event`\<`A`\>

Defined in: [index.ts:322](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L322)

Pass occurrences only while the behavior is true.

#### Parameters

##### b

[`Behavior`](Behavior.md)\<`boolean`\>

#### Returns

`Event`\<`A`\>

***

### hold()

> **hold**(`init`): [`Behavior`](Behavior.md)\<`A`\>

Defined in: [index.ts:269](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L269)

Step function: hold the last occurrence, committing at the moment boundary.

#### Parameters

##### init

`A`

#### Returns

[`Behavior`](Behavior.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:379](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L379)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:181](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L181)

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

Defined in: [index.ts:243](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L243)

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

Defined in: [index.ts:249](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L249)

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

Defined in: [index.ts:308](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L308)

Only the first occurrence passes.

#### Returns

`Event`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:222](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L222)

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

Defined in: [index.ts:331](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L331)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Event`\<`A`\>

#### Returns

`Event`\<`A`\>

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:196](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L196)

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

Defined in: [index.ts:262](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L262)

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

Defined in: [index.ts:206](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L206)

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

Defined in: [index.ts:336](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/frp/src/index.ts#L336)

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
