[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / when

# Function: when()

> **when**(`cond`, `thenRender`, `elseRender?`): `Node`

Defined in: [index.tsx:895](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/dom/src/index.tsx#L895)

Conditional region driven by a boolean behavior (no rebuild on same value).

## Parameters

### cond

`State`\<`boolean`\>

### thenRender

() => [`Child`](../type-aliases/Child.md)

### elseRender?

() => [`Child`](../type-aliases/Child.md)

## Returns

`Node`
