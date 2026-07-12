[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / bindInput

# Function: bindInput()

## Call Signature

> **bindInput**(`value`): `object`

Defined in: [index.tsx:899](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/dom/src/index.tsx#L899)

Two-way binding props for a text input. Spread onto an `<input>`.

### Parameters

#### value

`StateSource`\<`string`\>

### Returns

`object`

#### onInput

> **onInput**: (`e`) => `void`

##### Parameters

###### e

`Event`

##### Returns

`void`

#### value

> **value**: `State`\<`string`\>

## Call Signature

> **bindInput**(`value`, `set`): `object`

Defined in: [index.tsx:903](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/dom/src/index.tsx#L903)

Two-way binding props for a text input. Spread onto an `<input>`.

### Parameters

#### value

`State`\<`string`\>

#### set

(`v`) => `void`

### Returns

`object`

#### onInput

> **onInput**: (`e`) => `void`

##### Parameters

###### e

`Event`

##### Returns

`void`

#### value

> **value**: `State`\<`string`\>
