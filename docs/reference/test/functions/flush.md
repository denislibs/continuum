[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / flush

# Function: flush()

> **flush**(`rounds?`): `Promise`\<`void`\>

Defined in: [index.ts:66](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/test/src/index.ts#L66)

Drain the microtask queue so settled promises (e.g. `perform` results)
re-enter the network. Transactions themselves are synchronous — this only
waits for the JS runtime, not for Continuum.

## Parameters

### rounds?

`number` = `3`

## Returns

`Promise`\<`void`\>
