[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / ComponentProps

# Type Alias: ComponentProps\<T\>

> **ComponentProps**\<`T`\> = `T` *extends* keyof `JSX.IntrinsicElements` ? `JSX.IntrinsicElements`\[`T`\] : `T` *extends* (`props`) => `unknown` ? `P` : `never`

Defined in: [jsx-runtime.ts:55](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/dom/src/jsx-runtime.ts#L55)

Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.

## Type Parameters

### T

`T` *extends* keyof `JSX.IntrinsicElements` \| ((`props`) => `unknown`)
