[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Transaction

# Class: Transaction

Defined in: [index.ts:111](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L111)

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

Defined in: [index.ts:183](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L183)

**`Internal`**

***

### current

> `static` **current**: `Transaction` \| `null` = `null`

Defined in: [index.ts:113](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L113)

**`Internal`**

## Accessors

### pureZone

#### Get Signature

> **get** **pureZone**(): `boolean`

Defined in: [index.ts:186](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L186)

**`Internal`**

##### Returns

`boolean`

## Methods

### last()

> **last**(`action`): `void`

Defined in: [index.ts:127](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L127)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### post()

> **post**(`action`): `void`

Defined in: [index.ts:132](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L132)

#### Parameters

##### action

() => `void`

#### Returns

`void`

***

### prioritized()

> **prioritized**(`rank`, `action`): `void`

Defined in: [index.ts:122](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L122)

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

Defined in: [index.ts:215](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L215)

#### Type Parameters

##### A

`A`

#### Parameters

##### f

(`t`) => `A`

#### Returns

`A`
