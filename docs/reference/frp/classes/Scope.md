[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Scope

# Class: Scope

Defined in: [index.ts:45](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L45)

An owner for state and effects. Everything registered in a scope is torn
down when it disposes: children first (reverse creation order), then this
scope's own cleanups (also reverse). Stateful derivations (`hold`,
`accum`) and effects (`perform`) attach to the ambient scope; the dom
package builds its component owners on top of this class, so inside a
component everything just works.

## Constructors

### Constructor

> **new Scope**(`parent?`): `Scope`

Defined in: [index.ts:62](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L62)

Attach to `parent`; defaults to the ambient scope.

#### Parameters

##### parent?

`Scope` \| `null`

#### Returns

`Scope`

## Properties

### children

> **children**: `Scope`[] \| `null` = `null`

Defined in: [index.ts:49](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L49)

**`Internal`**

Child scopes (disposed first, reverse order); lazy.

***

### cleanups

> **cleanups**: () => `void`[] \| `null` = `null`

Defined in: [index.ts:47](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L47)

**`Internal`**

Teardowns to run on dispose (reverse order); lazy.

***

### flags

> **flags**: `number` = `0`

Defined in: [index.ts:54](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L54)

**`Internal`**

Bit 1 — disposed; bit 2 belongs to subclasses (dom Owner's
`mounted`): two booleans in one slot.

***

### parent

> **parent**: `Scope` \| `null`

Defined in: [index.ts:51](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L51)

**`Internal`**

## Accessors

### disposed

#### Get Signature

> **get** **disposed**(): `boolean`

Defined in: [index.ts:57](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L57)

True once `dispose()` has run.

##### Returns

`boolean`

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:73](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L73)

Tear down children, then own cleanups; detach from the parent. Idempotent.

#### Returns

`void`

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:68](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L68)

Register a teardown to run when this scope disposes.

#### Parameters

##### fn

() => `void`

#### Returns

`void`
