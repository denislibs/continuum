[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Dynamic

# Function: Dynamic()

> **Dynamic**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:770](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/dom/src/index.tsx#L770)

Switch the subtree on a behavior's value (rebuilds on every change).

```tsx
<Dynamic value={route}>{(r) => r === "home" ? <Home /> : <About />}</Dynamic>
```

## Type Parameters

### T

`T`

## Parameters

### props

#### children

(`value`) => [`Child`](../type-aliases/Child.md)

#### value

`Behavior`\<`T`\>

## Returns

`Node`
