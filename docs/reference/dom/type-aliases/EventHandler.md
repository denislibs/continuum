[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / EventHandler

# Type Alias: EventHandler\<Ev, E\>

> **EventHandler**\<`Ev`, `E`\> = (`e`) => `void`

Defined in: [jsx-runtime.ts:105](https://github.com/denislibs/continuum/blob/f5ae47f16f3158ab3acf341a203852240d621e88/packages/dom/src/jsx-runtime.ts#L105)

A handler whose `currentTarget` carries the tag's concrete element type —
the native-event answer to React's `MouseEvent<HTMLButtonElement>`:
`onSubmit` on a `<form>` gives `e.currentTarget: HTMLFormElement`, no cast.

## Type Parameters

### Ev

`Ev` *extends* `globalThis.Event`

### E

`E` *extends* `Element` = `Element`

## Parameters

### e

`Ev` & `object`

## Returns

`void`
