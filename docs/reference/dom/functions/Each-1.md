[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Each

# Function: Each()

> **Each**\<`T`, `K`\>(`props`): `Node`

Defined in: [index.tsx:753](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/dom/src/index.tsx#L753)

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
