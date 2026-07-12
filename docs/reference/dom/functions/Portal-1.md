[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Portal

# Function: Portal()

> **Portal**(`props`): `Node`

Defined in: [index.tsx:1058](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L1058)

Render children into another node (e.g. `document.body`), cleaning up on
unmount. Children are eager here — a portal renders immediately.

```tsx
<Portal mount={document.body}><Modal /></Portal>
```

## Parameters

### props

#### children?

[`Child`](../type-aliases/Child.md)

#### mount

`Node`

## Returns

`Node`
