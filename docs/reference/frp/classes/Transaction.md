[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Transaction

# Class: Transaction

Defined in: [index.ts:127](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L127)

One logical instant of time (a "moment"). Engine-level API: application
code normally never touches it — `fire`/`listen`/`sample` manage moments.

## Constructors

### Constructor

> **new Transaction**(): `Transaction`

#### Returns

`Transaction`

## Properties

### sending

> **sending**: `number` = `0`

Defined in: [index.ts:201](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L201)

**`Internal`**

***

### current

> `static` **current**: `Transaction` \| `null` = `null`

Defined in: [index.ts:129](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L129)

**`Internal`**

## Accessors

### pureZone

#### Get Signature

> **get** **pureZone**(): `boolean`

Defined in: [index.ts:204](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L204)

**`Internal`**

##### Returns

`boolean`

## Methods

### last()

> **last**(`action`): `void`

Defined in: [index.ts:145](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L145)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### post()

> **post**\<`X`\>(`fn`, `arg`): `void`

Defined in: [index.ts:150](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L150)

#### Type Parameters

##### X

`X`

#### Parameters

##### fn

(`x`) => `void`

##### arg

`X`

#### Returns

`void`

***

### prioritized()

> **prioritized**(`rank`, `action`): `void`

Defined in: [index.ts:140](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L140)

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

Defined in: [index.ts:233](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L233)

#### Type Parameters

##### A

`A`

#### Parameters

##### f

(`t`) => `A`

#### Returns

`A`
