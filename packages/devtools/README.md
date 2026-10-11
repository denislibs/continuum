# @continuum-js/devtools

Dev-only tools for [Continuum](https://denislibs.github.io/continuum/). Zero bytes in production: import it behind `import.meta.env.DEV`.

```ts
if (import.meta.env.DEV) {
  const { installDevtools } = await import("@continuum-js/devtools");
  installDevtools();
}
```

- **Strict layout** (law 3): patches the layout-forcing getters and methods
  (`offsetHeight`, `getBoundingClientRect`, `getComputedStyle`, `focus`, …)
  to report a read made inside an effect — a `listen`, `onMount` or `perform`
  callback — where it interleaves with the renderer's writes and forces a
  reflow. Reads inside `measure()`/`forceMeasure()` pass. Default: throw;
  pass `onViolation` to log instead.
- **Overlay**: live counters — scopes, subscriptions, moments/s, slow
  observers, layout violations — in a corner of the page. A growing
  subscription count with a steady UI is a leak.

`installDevtools()` returns an uninstall function that restores the
prototypes and removes the overlay.
