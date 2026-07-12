[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / Transaction

# Class: Transaction

Defined in: [index.ts:141](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L141)

One logical instant of time (a "moment"). Engine-level API: application
code normally never touches it — `fire`/`listen`/`sample` manage moments.

## Constructors

### Constructor

> **new Transaction**(): `Transaction`

#### Returns

`Transaction`

## Properties

### id

> **id**: `number`

Defined in: [index.ts:155](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L155)

**`Internal`**

Monotonic MOMENT id. The pool below recycles the object, so
object identity no longer distinguishes moments across time — anything
comparing a SAVED transaction against a later one (makeFire's
once-per-moment guard) must compare ids. In-moment staging keyed by
identity is fine: those keys reset at the boundary, and an aborted
moment's object is never recycled.

***

### sending

> **sending**: `number` = `0`

Defined in: [index.ts:258](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L258)

**`Internal`**

***

### current

> `static` **current**: `Transaction` \| `null` = `null`

Defined in: [index.ts:143](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L143)

**`Internal`**

## Accessors

### pureZone

#### Get Signature

> **get** **pureZone**(): `boolean`

Defined in: [index.ts:261](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L261)

**`Internal`**

##### Returns

`boolean`

## Methods

### last()

#### Call Signature

> **last**(`action`): `void`

Defined in: [index.ts:196](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L196)

##### Parameters

###### action

() => `void`

##### Returns

`void`

#### Call Signature

> **last**\<`X`\>(`action`, `arg`): `void`

Defined in: [index.ts:197](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L197)

##### Type Parameters

###### X

`X`

##### Parameters

###### action

(`x`) => `void`

###### arg

`X`

##### Returns

`void`

***

### post()

> **post**\<`X`\>(`fn`, `arg`): `void`

Defined in: [index.ts:205](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L205)

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

Defined in: [index.ts:179](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L179)

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

Defined in: [index.ts:324](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L324)

#### Type Parameters

##### A

`A`

#### Parameters

##### f

(`t`) => `A`

#### Returns

`A`
