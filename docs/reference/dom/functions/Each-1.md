[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Each

# Function: Each()

> **Each**\<`T`, `K`\>(`props`): `Node`

Defined in: [index.tsx:740](https://github.com/denislibs/continuum/blob/8e7ee39923fe03f7015d85000909971978a707f2/packages/dom/src/index.tsx#L740)

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

`Behavior`\<`T`[]\>

## Returns

`Node`
