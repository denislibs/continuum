[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / advanceTimers

# Function: advanceTimers()

> **advanceTimers**(`ms`): `Promise`\<`void`\>

Defined in: [index.ts:75](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/test/src/index.ts#L75)

Advance vitest fake timers by `ms` and flush microtasks, so time-based
combinators (`debounce`, `throttle`, `interval`, `delay`) fire and their
downstream settles. Requires `vi.useFakeTimers()` in the test.

## Parameters

### ms

`number`

## Returns

`Promise`\<`void`\>
