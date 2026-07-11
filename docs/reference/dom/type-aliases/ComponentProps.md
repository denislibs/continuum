[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / ComponentProps

# Type Alias: ComponentProps\<T\>

> **ComponentProps**\<`T`\> = `T` *extends* keyof `JSX.IntrinsicElements` ? `JSX.IntrinsicElements`\[`T`\] : `T` *extends* (`props`) => `unknown` ? `P` : `never`

Defined in: [jsx-runtime.ts:55](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/dom/src/jsx-runtime.ts#L55)

Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.

## Type Parameters

### T

`T` *extends* keyof `JSX.IntrinsicElements` \| ((`props`) => `unknown`)
