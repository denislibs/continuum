[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Stream

# Class: Stream\<A\>

Defined in: [index.ts:198](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L198)

Discrete occurrences over time (push). Denotationally `[(Time, A)]`: at most
one occurrence per moment — simultaneous inputs coalesce (see `merge`).

## Type Parameters

### A

`A`

## Constructors

### Constructor

> **new Stream**\<`A`\>(`rank?`): `Stream`\<`A`\>

Defined in: [index.ts:230](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L230)

#### Parameters

##### rank?

`number` = `0`

#### Returns

`Stream`\<`A`\>

## Properties

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:226](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L226)

True once `dispose()` has run.

***

### onWake

> **onWake**: (() => `void`) \| `null` = `null`

Defined in: [index.ts:224](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L224)

**`Internal`**

Reseed hook run on wake, before inputs attach (lift caches).

***

### rank

> **rank**: `number`

Defined in: [index.ts:200](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L200)

**`Internal`**

Topological height in the graph (propagation order).

## Methods

### accum()

> **accum**\<`B`\>(`init`, `f`): [`Behavior`](Behavior.md)\<`B`\>

Defined in: [index.ts:497](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L497)

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

Defined in: [index.ts:471](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L471)

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

Defined in: [index.ts:378](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L378)

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

Defined in: [index.ts:392](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L392)

Detach this node from its inputs (breaking the push chain so it can be
collected) and drop its downstream links. Idempotent. Cascades upstream
through derived intermediates that become unused, but never to sources.

#### Returns

`void`

***

### ensureBiggerThan()

> **ensureBiggerThan**(`limit`): `void`

Defined in: [index.ts:246](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L246)

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

Defined in: [index.ts:419](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L419)

#### Parameters

##### pred

(`a`) => `boolean`

#### Returns

`Stream`\<`A`\>

***

### gate()

> **gate**(`b`): `Stream`\<`A`\>

Defined in: [index.ts:516](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L516)

Pass occurrences only while the behavior is true.

#### Parameters

##### b

[`Behavior`](Behavior.md)\<`boolean`\>

#### Returns

`Stream`\<`A`\>

***

### hold()

> **hold**(`init`): [`Behavior`](Behavior.md)\<`A`\>

Defined in: [index.ts:435](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L435)

Step function: hold the last occurrence, committing at the moment boundary.

#### Parameters

##### init

`A`

#### Returns

[`Behavior`](Behavior.md)\<`A`\>

***

### listen()

> **listen**(`h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:573](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L573)

Observer (phase post): fires after the moment closes, FIFO.

#### Parameters

##### h

(`a`) => `void`

#### Returns

[`Unlisten`](../type-aliases/Unlisten.md)

***

### listen\_()

> **listen\_**(`target`, `h`): [`Unlisten`](../type-aliases/Unlisten.md)

Defined in: [index.ts:289](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L289)

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

Defined in: [index.ts:409](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L409)

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

Defined in: [index.ts:415](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L415)

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

Defined in: [index.ts:502](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L502)

Only the first occurrence passes.

#### Returns

`Stream`\<`A`\>

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:383](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L383)

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

Defined in: [index.ts:525](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L525)

Left-biased merge: on simultaneous occurrences the left wins.

#### Parameters

##### other

`Stream`\<`A`\>

#### Returns

`Stream`\<`A`\>

***

### retain()

> **retain**(): `this`

Defined in: [index.ts:598](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L598)

Keep this node alive when its last listener unsubscribes. Derived nodes
normally auto-dispose at that point (so per-component derivations don't
leak onto long-lived sources); call `retain()` on a derivation you
intentionally share across mounts (e.g. a module-level one).

#### Returns

`this`

***

### send\_()

> **send\_**(`t`, `a`): `void`

Defined in: [index.ts:325](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L325)

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

Defined in: [index.ts:428](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L428)

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

### source()

> **source**\<`X`\>(`input`, `h`): `void`

Defined in: [index.ts:339](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L339)

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

Defined in: [index.ts:363](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L363)

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

### unobserved()

> **unobserved**(): `boolean`

Defined in: [index.ts:334](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L334)

**`Internal`**

True when nothing observes this node (no listeners, no downstream).

#### Returns

`boolean`

***

### merge()

> `static` **merge**\<`A`\>(`ea`, `eb`, `combine`): `Stream`\<`A`\>

Defined in: [index.ts:530](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L530)

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
