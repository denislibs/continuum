[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Dynamic

# Function: Dynamic()

> **Dynamic**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:966](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/dom/src/index.tsx#L966)

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

`Wire`\<`T`\>

## Returns

`Node`
