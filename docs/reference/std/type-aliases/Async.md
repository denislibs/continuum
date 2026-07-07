[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:167](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/std/src/index.ts#L167)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
