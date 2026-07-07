[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / when

# Function: when()

> **when**(`cond`, `thenRender`, `elseRender?`): `Node`

Defined in: [index.tsx:606](https://github.com/denislibs/continuum/blob/024c0131f28e2b026cf3029c8a40baa1c2fe4fdb/packages/dom/src/index.tsx#L606)

Conditional region driven by a boolean behavior (no rebuild on same value).

## Parameters

### cond

`Behavior`\<`boolean`\>

### thenRender

() => [`Child`](../type-aliases/Child.md)

### elseRender?

() => [`Child`](../type-aliases/Child.md)

## Returns

`Node`
