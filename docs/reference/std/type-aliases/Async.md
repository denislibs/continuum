[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:168](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/std/src/index.ts#L168)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
