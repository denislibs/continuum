[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / flush

# Function: flush()

> **flush**(`rounds?`): `Promise`\<`void`\>

Defined in: [index.ts:66](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/test/src/index.ts#L66)

Drain the microtask queue so settled promises (e.g. `perform` results)
re-enter the network. Transactions themselves are synchronous — this only
waits for the JS runtime, not for Continuum.

## Parameters

### rounds?

`number` = `3`

## Returns

`Promise`\<`void`\>
