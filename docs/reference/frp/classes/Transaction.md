[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Transaction

# Class: Transaction

Defined in: [index.ts:25](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L25)

One logical instant of time (a "moment"). Engine-level API: application
code normally never touches it — `fire`/`listen`/`sample` manage moments.

## Constructors

### Constructor

> **new Transaction**(): `Transaction`

#### Returns

`Transaction`

## Properties

### current

> `static` **current**: `Transaction` \| `null` = `null`

Defined in: [index.ts:27](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L27)

**`Internal`**

## Methods

### last()

> **last**(`action`): `void`

Defined in: [index.ts:41](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L41)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### post()

> **post**(`action`): `void`

Defined in: [index.ts:46](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L46)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### prioritized()

> **prioritized**(`rank`, `action`): `void`

Defined in: [index.ts:36](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L36)

#### Parameters

##### rank

`number`

##### action

(`t`) => `void`

#### Returns

`void`

***

### run()

> `static` **run**\<`A`\>(`f`): `A`

Defined in: [index.ts:106](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/frp/src/index.ts#L106)

#### Type Parameters

##### A

`A`

#### Parameters

##### f

(`t`) => `A`

#### Returns

`A`
