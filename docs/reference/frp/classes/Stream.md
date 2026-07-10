[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Stream

# Class: Stream\<A\>

Defined in: [index.ts:177](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L177)

Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
one occurrence per moment — simultaneous inputs coalesce (see `merge`).

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Stream**\<`A`\>(`rank?`): `Stream`\<`A`\>

Defined in: [index.ts:194](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L194)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Stream`\<`A`\>

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:190](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L190)

True once `dispose()` has run.

***

### rank

> **rank**: `number`

Defined in: [index.ts:179](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L179)

**`Internal`**

Topological height in the graph (propagation order).

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Behavior`](Behavior.md)\<`B`\>

Defined in: [index.ts:399](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L399)

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

> **accumE**\<`B`\>(`init`, `f`): `Stream`\<`B`\>

Defined in: [index.ts:390](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L390)

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

`Stream`\<`B`\>

***

### consume()

> **consume**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:313](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L313)

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

Defined in: [index.ts:327](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L327)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`): `void`

Defined in: [index.ts:210](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L210)

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

Defined in: [index.ts:349](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L349)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Stream`\<`A`\>

***

### gate()

> **gate**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:418](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L418)

Pass occurrences only while the behavior is true.

#### Parameters

##### b

[`Behavior`](Behavior.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

***

### hold()

> **hold**(`init`): [`Behavior`](Behavior.md)\<`A`\>

Defined in: [index.ts:365](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L365)

Step function: hold the last occurrence, committing at the moment boundary.

#### Parameters

##### init

`A`

#### Returns

[`Behavior`](Behavior.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:475](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L475)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:253](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L253)

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

Defined in: [index.ts:339](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L339)

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

Defined in: [index.ts:345](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L345)

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

Defined in: [index.ts:404](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L404)

Only the first occurrence passes.

#### Returns

`Stream`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:318](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L318)

**`Internal`**

Register an extra teardown to run on `dispose()`.

#### Parameters

##### fn

() => `void`

#### Returns

`void`

***

### orElse()

> **orElse**(`other`): `Stream`\<`A`\>

Defined in: [index.ts:427](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L427)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Stream`\<`A`\>

#### Returns

`Stream`\<`A`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:500](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L500)

Keep this node alive when its last listener unsubscribes. Derived nodes
normally auto-dispose at that point (so per-component derivations don't
leak onto long-lived sources); call `retain()` on a derivation you
intentionally share across mounts (e.g. a module-level one).

#### Returns

`this`

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:288](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L288)

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

> **snapshot**\<`B`, `C`\>(`b`, `f`): `Stream`\<`C`\>

Defined in: [index.ts:358](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L358)

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

`Stream`\<`C`\>

***

### subscribe()

> **subscribe**\<`X`\>(`input`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:298](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L298)

**`Internal`**

Subscribe this node to `input`, returning a teardown that also
cascades: if `input` is a derived node left with no listeners, it disposes
too. Sources (no cleanups of their own) are never auto-disposed.

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

### merge()

> `static` **merge**\<`A`\>(`ea`, `eb`, `combine`): `Stream`\<`A`\>

Defined in: [index.ts:432](https://github.com/denislibs/continuum/blob/27a9bec15130806dedfb8c21e1f5925fe5c38264/packages/frp/src/index.ts#L432)

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
