[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Portal

# Function: Portal()

> **Portal**(`props`): `Node`

Defined in: [index.tsx:790](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/dom/src/index.tsx#L790)

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
