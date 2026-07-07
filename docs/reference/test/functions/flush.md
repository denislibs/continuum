[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / flush

# Function: flush()

> **flush**(`rounds?`): `Promise`\<`void`\>

Defined in: [index.ts:66](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/test/src/index.ts#L66)

Drain the microtask queue so settled promises (e.g. `perform` results)
re-enter the network. Transactions themselves are synchronous — this only
waits for the JS runtime, not for Continuum.

## Parameters

### rounds?

`number` = `3`

## Returns

`Promise`\<`void`\>
