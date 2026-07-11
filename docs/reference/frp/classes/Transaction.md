[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Transaction

# Class: Transaction

Defined in: [index.ts:25](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L25)

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

Defined in: [index.ts:97](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L97)

**`Internal`**

***

### current

> `static` **current**: `Transaction` \| `null` = `null`

Defined in: [index.ts:27](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L27)

**`Internal`**

## Accessors

### pureZone

#### Get Signature

> **get** **pureZone**(): `boolean`

Defined in: [index.ts:100](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L100)

**`Internal`**

##### Returns

`boolean`

## Methods

### last()

> **last**(`action`): `void`

Defined in: [index.ts:41](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L41)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### post()

> **post**(`action`): `void`

Defined in: [index.ts:46](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L46)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### prioritized()

> **prioritized**(`rank`, `action`): `void`

Defined in: [index.ts:36](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L36)

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

Defined in: [index.ts:129](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/frp/src/index.ts#L129)

#### Type Parameters

##### A

`A`

#### Parameters

##### f

(`t`) => `A`

#### Returns

`A`
