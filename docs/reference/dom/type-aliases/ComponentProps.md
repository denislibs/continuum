[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / ComponentProps

# Type Alias: ComponentProps\<T\>

> **ComponentProps**\<`T`\> = `T` *extends* keyof `JSX.IntrinsicElements` ? `JSX.IntrinsicElements`\[`T`\] : `T` *extends* (`props`) => `unknown` ? `P` : `never`

Defined in: [jsx-runtime.ts:64](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/dom/src/jsx-runtime.ts#L64)

Props of an intrinsic tag (`ComponentProps<"button">`) or of a component
function (`ComponentProps<typeof Card>`) — for wrapping and forwarding.

## Type Parameters

### T

`T` *extends* keyof `JSX.IntrinsicElements` \| ((`props`) => `unknown`)
