[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / when

# Function: when()

> **when**(`cond`, `thenRender`, `elseRender?`): `Node`

Defined in: [index.tsx:606](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/dom/src/index.tsx#L606)

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
