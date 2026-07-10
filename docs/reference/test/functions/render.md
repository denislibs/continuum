[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / render

# Function: render()

> **render**(`view`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [index.ts:22](https://github.com/denislibs/continuum/blob/944371c394c0c26acf1400ff3d9564ada9a945a4/packages/test/src/index.ts#L22)

Mount `view` into a fresh container appended to `document.body` (so focus
and event bubbling behave like in a real page). Dispose manually, or let
`cleanup()` collect everything at the end of the test.

## Parameters

### view

() => `Child`

## Returns

[`RenderResult`](../interfaces/RenderResult.md)
