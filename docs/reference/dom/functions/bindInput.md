[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / bindInput

# Function: bindInput()

## Call Signature

> **bindInput**(`value`): `object`

Defined in: [index.tsx:906](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L906)

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

Defined in: [index.tsx:910](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L910)

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
