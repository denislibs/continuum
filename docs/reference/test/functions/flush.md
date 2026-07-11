[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / flush

# Function: flush()

> **flush**(`rounds?`): `Promise`\<`void`\>

Defined in: [index.ts:66](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/test/src/index.ts#L66)

Drain the microtask queue so settled promises (e.g. `perform` results)
re-enter the network. Transactions themselves are synchronous — this only
waits for the JS runtime, not for Continuum.

## Parameters

### rounds?

`number` = `3`

## Returns

`Promise`\<`void`\>
