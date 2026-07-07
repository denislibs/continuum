[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Portal

# Function: Portal()

> **Portal**(`props`): `Node`

Defined in: [index.tsx:756](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/dom/src/index.tsx#L756)

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
