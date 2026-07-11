[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / bindInput

# Function: bindInput()

## Call Signature

> **bindInput**(`value`): `object`

Defined in: [index.tsx:696](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/dom/src/index.tsx#L696)

Two-way binding props for a text input. Spread onto an `<input>`.

### Parameters

#### value

`WireSource`\<`string`\>

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

> **value**: `Wire`\<`string`\>

## Call Signature

> **bindInput**(`value`, `set`): `object`

Defined in: [index.tsx:700](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/dom/src/index.tsx#L700)

Two-way binding props for a text input. Spread onto an `<input>`.

### Parameters

#### value

`Wire`\<`string`\>

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

> **value**: `Wire`\<`string`\>
