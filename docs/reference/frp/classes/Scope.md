[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Scope

# Class: Scope

Defined in: [index.ts:37](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L37)

An owner for state and effects. Everything registered in a scope is torn
down when it disposes: children first (reverse creation order), then this
scope's own cleanups (also reverse). Stateful derivations (`hold`,
`accum`) and effects (`perform`) attach to the ambient scope; the dom
package builds its component owners on top of this class, so inside a
component everything just works.

## Constructors

### Constructor

> **new Scope**(`parent?`): `Scope`

Defined in: [index.ts:48](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L48)

Attach to `parent`; defaults to the ambient scope.

#### Parameters

##### parent?

`Scope` \| `null`

#### Returns

`Scope`

## Properties

### children

> **children**: `Scope`[] \| `null` = `null`

Defined in: [index.ts:41](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L41)

**`Internal`**

Child scopes (disposed first, reverse order); lazy.

***

### cleanups

> **cleanups**: () => `void`[] \| `null` = `null`

Defined in: [index.ts:39](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L39)

**`Internal`**

Teardowns to run on dispose (reverse order); lazy.

***

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:45](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L45)

True once `dispose()` has run.

***

### parent

> **parent**: `Scope` \| `null`

Defined in: [index.ts:43](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L43)

**`Internal`**

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:59](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L59)

Tear down children, then own cleanups; detach from the parent. Idempotent.

#### Returns

`void`

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:54](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L54)

Register a teardown to run when this scope disposes.

#### Parameters

##### fn

() => `void`

#### Returns

`void`
