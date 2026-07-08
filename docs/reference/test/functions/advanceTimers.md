[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / advanceTimers

# Function: advanceTimers()

> **advanceTimers**(`ms`): `Promise`\<`void`\>

Defined in: [index.ts:75](https://github.com/denislibs/continuum/blob/d7c5ccacccc04163a481bd76c5d444925252087e/packages/test/src/index.ts#L75)

Advance vitest fake timers by `ms` and flush microtasks, so time-based
combinators (`debounce`, `throttle`, `interval`, `delay`) fire and their
downstream settles. Requires `vi.useFakeTimers()` in the test.

## Parameters

### ms

`number`

## Returns

`Promise`\<`void`\>
