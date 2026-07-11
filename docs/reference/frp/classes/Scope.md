[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Scope

# Class: Scope

Defined in: [index.ts:27](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L27)

An owner for state and effects. Everything registered in a scope is torn
down when it disposes: children first (reverse creation order), then this
scope's own cleanups (also reverse). Stateful derivations (`hold`,
`accum`) and effects (`perform`) attach to the ambient scope; the dom
package builds its component owners on top of this class, so inside a
component everything just works.

## Constructors

### Constructor

> **new Scope**(`parent?`): `Scope`

Defined in: [index.ts:38](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L38)

Attach to `parent`; defaults to the ambient scope.

#### Parameters

##### parent?

`Scope` \| `null`

#### Returns

`Scope`

## Properties

### children

> **children**: `Scope`[] = `[]`

Defined in: [index.ts:31](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L31)

**`Internal`**

Child scopes (disposed before this one, reverse order).

***

### cleanups

> **cleanups**: () => `void`[] = `[]`

Defined in: [index.ts:29](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L29)

**`Internal`**

Teardowns to run on dispose (reverse order).

#### Returns

`void`

***

### disposed

> **disposed**: `boolean` = `false`

Defined in: [index.ts:35](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L35)

True once `dispose()` has run.

***

### parent

> **parent**: `Scope` \| `null`

Defined in: [index.ts:33](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L33)

**`Internal`**

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [index.ts:49](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L49)

Tear down children, then own cleanups; detach from the parent. Idempotent.

#### Returns

`void`

***

### onDispose()

> **onDispose**(`fn`): `void`

Defined in: [index.ts:44](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L44)

Register a teardown to run when this scope disposes.

#### Parameters

##### fn

() => `void`

#### Returns

`void`
