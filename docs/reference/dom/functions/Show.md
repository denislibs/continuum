[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Show

# Function: Show()

> **Show**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:702](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/dom/src/index.tsx#L702)

Conditional region. Rebuilds only when the truthiness of `when` toggles; the
(narrowed) value is passed to the children render function at build time.

```tsx
<Show when={user} fallback={() => <Guest />}>
  {(u) => <span>{u.name}</span>}
</Show>
```

## Type Parameters

### T

`T`

## Parameters

### props

#### children

(`value`) => [`Child`](../type-aliases/Child.md)

#### fallback?

() => [`Child`](../type-aliases/Child.md)

#### when

`Behavior`\<`T`\>

## Returns

`Node`
