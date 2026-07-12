[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Each

# Function: Each()

> **Each**\<`T`, `K`\>(`props`): `Node`

Defined in: [index.tsx:1026](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L1026)

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

`State`\<`T`[]\>

## Returns

`Node`
