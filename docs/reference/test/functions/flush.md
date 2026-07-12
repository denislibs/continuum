[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / flush

# Function: flush()

> **flush**(`rounds?`): `Promise`\<`void`\>

Defined in: [index.ts:66](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/test/src/index.ts#L66)

Drain the microtask queue so settled promises (e.g. `perform` results)
re-enter the network. Transactions themselves are synchronous — this only
waits for the JS runtime, not for Continuum.

## Parameters

### rounds?

`number` = `3`

## Returns

`Promise`\<`void`\>
