[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Dynamic

# Function: Dynamic()

> **Dynamic**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:775](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/dom/src/index.tsx#L775)

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
