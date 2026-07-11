[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / when

# Function: when()

> **when**(`cond`, `thenRender`, `elseRender?`): `Node`

Defined in: [index.tsx:640](https://github.com/denislibs/continuum/blob/1009133524ef880e679ba1f379dfc0cffc91979b/packages/dom/src/index.tsx#L640)

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
