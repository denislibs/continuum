[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Show

# Function: Show()

> **Show**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:731](https://github.com/denislibs/continuum/blob/9e6d8fee1895bb34167cfe31c364b635d2b71604/packages/dom/src/index.tsx#L731)

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
