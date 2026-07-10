[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:171](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/std/src/index.ts#L171)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
