[**@continuum-js/dom**](../index.md)

***

[@continuum-js/dom](../index.md) / EventHandler

# Type Alias: EventHandler\<Ev, E\>

> **EventHandler**\<`Ev`, `E`\> = (`e`) => `void`

Defined in: [jsx-runtime.ts:96](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/dom/src/jsx-runtime.ts#L96)

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
