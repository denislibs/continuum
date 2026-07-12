[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / ComponentProps

# Type Alias: ComponentProps\<T\>

> **ComponentProps**\<`T`\> = `T` *extends* keyof `JSX.IntrinsicElements` ? `JSX.IntrinsicElements`\[`T`\] : `T` *extends* (`props`) => `unknown` ? `P` : `never`

Defined in: [jsx-runtime.ts:64](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/dom/src/jsx-runtime.ts#L64)

Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.

## Type Parameters

### T

`T` *extends* keyof `JSX.IntrinsicElements` \| ((`props`) => `unknown`)
