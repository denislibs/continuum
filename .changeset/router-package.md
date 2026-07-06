---
"@continuum-js/router": minor
---

First release of the router: the URL as a `Behavior<URL>` (`location()` /
`navigate()`), nested routes with `<Outlet>`, reactive typed params
(`useParams()` updates in place — same-route navigation never rebuilds the
page), `<Link>` with an active class, `lazy()` code-split pages (separate
chunks via literal dynamic imports, cached after first visit) and pure guard
functions with replace-redirects.
