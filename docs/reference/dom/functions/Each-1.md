[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Each

# Function: Each()

> **Each**\<`T`, `K`\>(`props`): `Node`

Defined in: [index.tsx:805](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/dom/src/index.tsx#L805)

Keyed list. The `by` key selector defaults to identity. (Note: `key` is a
reserved JSX attribute stripped by the compiler, so the prop is named `by`.)

```tsx
<Each each={items} by={(i) => i.id}>{(item) => <li>{item.name}</li>}</Each>
```

## Type Parameters

### T

`T`

### K

`K` = `T`

## Parameters

### props

#### by?

(`item`) => `K`

#### children

(`item`) => [`Child`](../type-aliases/Child.md)

#### each

`Wire`\<`T`[]\>

## Returns

`Node`
