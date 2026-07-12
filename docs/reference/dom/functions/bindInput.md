[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / bindInput

# Function: bindInput()

## Call Signature

> **bindInput**(`value`): `object`

Defined in: [index.tsx:829](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/dom/src/index.tsx#L829)

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

Defined in: [index.tsx:833](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/dom/src/index.tsx#L833)

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
