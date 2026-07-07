[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Dynamic

# Function: Dynamic()

> **Dynamic**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:693](https://github.com/denislibs/continuum/blob/40ab9b6150468b12ff931c97fb4264ea8455bf9d/packages/dom/src/index.tsx#L693)

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
