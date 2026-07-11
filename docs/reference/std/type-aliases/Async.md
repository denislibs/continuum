[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:168](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/std/src/index.ts#L168)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
