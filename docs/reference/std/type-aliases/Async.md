[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:171](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/std/src/index.ts#L171)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
