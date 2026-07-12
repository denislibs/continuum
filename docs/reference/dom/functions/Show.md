[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Show

# Function: Show()

> **Show**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:997](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/dom/src/index.tsx#L997)

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

`State`\<`T`\>

## Returns

`Node`
