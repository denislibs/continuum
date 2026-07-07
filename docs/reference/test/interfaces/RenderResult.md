[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / RenderResult

# Interface: RenderResult

Defined in: [index.ts:8](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/test/src/index.ts#L8)

A mounted view under test.

## Properties

### container

> **container**: `HTMLElement`

Defined in: [index.ts:10](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/test/src/index.ts#L10)

The container element, attached to `document.body`.

***

### dispose

> **dispose**: () => `void`

Defined in: [index.ts:12](https://github.com/denislibs/continuum/blob/6dcf7e4a1529edbb0b79752b06146206b3d754b5/packages/test/src/index.ts#L12)

Unmount the view (cascading FRP/ownership cleanup) and drop the container.

#### Returns

`void`
