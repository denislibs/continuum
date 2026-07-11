[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Show

# Function: Show()

> **Show**\<`T`\>(`props`): `Node`

Defined in: [index.tsx:783](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/dom/src/index.tsx#L783)

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

`Wire`\<`T`\>

## Returns

`Node`
