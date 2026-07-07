[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / ComponentProps

# Type Alias: ComponentProps\<T\>

> **ComponentProps**\<`T`\> = `T` *extends* keyof `JSX.IntrinsicElements` ? `JSX.IntrinsicElements`\[`T`\] : `T` *extends* (`props`) => `unknown` ? `P` : `never`

Defined in: [jsx-runtime.ts:56](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/dom/src/jsx-runtime.ts#L56)

Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.

## Type Parameters

### T

`T` *extends* keyof `JSX.IntrinsicElements` \| ((`props`) => `unknown`)
