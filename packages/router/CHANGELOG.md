# @continuum-js/router

## 0.1.1

### Patch Changes

- Updated dependencies [5bdb51a]
  - @continuum-js/dom@0.4.0
  - @continuum-js/frp@0.4.0
  - @continuum-js/std@0.4.0

## 0.1.0

### Minor Changes

- dc519c9: First release of the router: the URL as a `Behavior<URL>` (`location()` /
  `navigate()`), nested routes with `<Outlet>`, reactive typed params
  (`useParams()` updates in place — same-route navigation never rebuilds the
  page), `<Link>` with an active class, `lazy()` code-split pages (separate
  chunks via literal dynamic imports, cached after first visit) and pure guard
  functions with replace-redirects.

### Patch Changes

- Updated dependencies [dc519c9]
  - @continuum-js/dom@0.3.1
  - @continuum-js/frp@0.3.1
  - @continuum-js/std@0.3.1
