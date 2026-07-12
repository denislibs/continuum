[**@continuum-js/std**](../index.md)

***

[@continuum-js/std](../index.md) / Async

# Type Alias: Async\<T\>

> **Async**\<`T`\> = \{ `status`: `"idle"`; \} \| \{ `status`: `"loading"`; \} \| \{ `status`: `"ok"`; `value`: `T`; \} \| \{ `error`: `unknown`; `status`: `"error"`; \}

Defined in: [index.ts:169](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/std/src/index.ts#L169)

The lifecycle of an asynchronous request as first-class data.

## Type Parameters

### T

`T`
