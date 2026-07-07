[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / EventHandler

# Type Alias: EventHandler\<Ev, E\>

> **EventHandler**\<`Ev`, `E`\> = (`e`) => `void`

Defined in: [jsx-runtime.ts:97](https://github.com/denislibs/continuum/blob/d1f864a62eca67ab5b08c508a18d1e6c54cf8387/packages/dom/src/jsx-runtime.ts#L97)

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
