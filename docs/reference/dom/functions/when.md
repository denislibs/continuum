[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / when

# Function: when()

> **when**(`cond`, `thenRender`, `elseRender?`): `Node`

Defined in: [index.tsx:631](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/dom/src/index.tsx#L631)

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
