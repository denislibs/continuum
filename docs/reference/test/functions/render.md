[**@continuum-js/test**](../index.md)

***

[@continuum-js/test](../index.md) / render

# Function: render()

> **render**(`view`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [index.ts:22](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/test/src/index.ts#L22)

Mount `view` into a fresh container appended to `document.body` (so focus
and event bubbling behave like in a real page). Dispose manually, or let
`cleanup()` collect everything at the end of the test.

## Parameters

### view

() => `Child`

## Returns

[`RenderResult`](../interfaces/RenderResult.md)
