[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:167](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/std/src/index.ts#L167)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
