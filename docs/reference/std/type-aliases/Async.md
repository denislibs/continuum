[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:168](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/std/src/index.ts#L168)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
