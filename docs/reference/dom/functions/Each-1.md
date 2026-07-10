[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Each

# Function: Each()

> **Each**\<`T`, `K`\>(`props`): `Node`

Defined in: [index.tsx:758](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/dom/src/index.tsx#L758)

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
