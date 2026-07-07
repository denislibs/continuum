[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / Catch

# Function: Catch()

> **Catch**(`props`): `Node`

Defined in: [index.tsx:780](https://github.com/denislibs/continuum/blob/8d71c388977ff9456393e0cbc710bd219c8150c3/packages/dom/src/index.tsx#L780)

Error boundary. Catches a throw while building its children and a throw
during any nested dynamic-region rebuild (`Show`/`Dynamic`/`dyn`), disposes
the failed subtree's ownership, and renders `fallback` instead. `reset`
re-renders the children from scratch.

Children must be a thunk — eager JSX would run (and throw) before `Catch`
gets control:

```tsx
<Catch fallback={(e, reset) => <button onClick={reset}>retry</button>}>
  {() => <Risky />}
</Catch>
```

Not covered: throws inside binding `map` functions (keep them pure) and
inside `listen` effects. Async/IO errors never throw at all — `perform`
and `resource` deliver them as data. An error thrown by `fallback` itself
escalates to the next boundary up.

## Parameters

### props

#### children

[`Child`](../type-aliases/Child.md) \| (() => [`Child`](../type-aliases/Child.md))

#### fallback

(`error`, `reset`) => [`Child`](../type-aliases/Child.md)

## Returns

`Node`
