[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:167](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/std/src/index.ts#L167)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
